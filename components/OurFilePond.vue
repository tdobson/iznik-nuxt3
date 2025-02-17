<template>
  <div>
    <file-pond
      v-if="supported"
      ref="pond"
      name="photo"
      :allow-multiple="multiple"
      accepted-file-types="image/jpeg, image/png, image/gif, image/jpg, image/heic"
      :file-validate-type-detect-type="validateType"
      :files="myFiles"
      image-validate-size-max-width="400"
      image-validate-size-max-height="400"
      image-crop-aspect-ratio="1"
      label-idle='Drag & drop photos here or <span class="btn btn-white ction"> Browse </span>'
      :server="{ process, revert, restore, load, fetch }"
      :drop-on-element="false"
      :drop-on-page="true"
      :max-parallel-uploads="1"
      @init="photoInit"
      @processfile="processed"
      @processfiles="allProcessed"
      @error="error"
      @preparefile="preparefile"
    />
    <div v-else>
      Sorry, photo uploads aren't supported on this browser. Maybe it's old?
    </div>
  </div>
</template>
<script>
import * as Sentry from '@sentry/browser'
import { useComposeStore } from '../stores/compose'
import { useImageStore } from '../stores/image'

export default {
  props: {
    imgtype: {
      type: String,
      required: true,
    },
    imgflag: {
      type: String,
      required: true,
    },
    ocr: {
      type: Boolean,
      required: false,
      default: false,
    },
    identify: {
      type: Boolean,
      required: false,
      default: false,
    },
    browse: {
      type: Boolean,
      required: false,
      default: true,
    },
    multiple: {
      type: Boolean,
      required: false,
      default: false,
    },
    msgid: {
      type: Number,
      required: false,
      default: null,
    },
    groupid: {
      type: Number,
      required: false,
      default: null,
    },
  },
  setup(props) {
    const composeStore = useComposeStore()
    const imageStore = useImageStore()

    return {
      composeStore,
      imageStore,
    }
  },
  data() {
    return {
      imageid: null,
      imagethumb: null,
      image: null,
      ocred: null,
      identified: null,
      myFiles: [],
      supported: true,
    }
  },
  mounted() {
    if (process.client) {
      const externalScript = document.createElement('script')
      externalScript.setAttribute(
        'src',
        'https://cdn.jsdelivr.net/npm/heic2any_ags@0.0.4/dist/heic2any.min.js'
      )
      document.head.appendChild(externalScript)
    }
  },
  methods: {
    photoInit() {
      if (!this.$refs.pond._pond) {
        // This is the only way of finding out if the browser is supported - see
        // https://github.com/pqina/vue-filepond/issues/136
        this.supported = false
      } else {
        this.$emit('init')

        if (this.browse) {
          // We have rendered the filepond instance.  Trigger browse so that they can upload a photo without an
          // extra click.
          this.$refs.pond.browse()
        }
      }
    },
    preparefile(file, output) {
      console.log('Transformed', file?.fileSize, output?.size)
    },
    async process(fieldName, file, metadata, load, error, progress, abort) {
      this.composeStore.uploading = true

      const data = new FormData()
      const fn = file.name.toLowerCase()
      let blob = null

      if (fn.includes('.heic')) {
        // If we have an HEIC file, then the server can't cope with it as it will fail imagecreatefromstring, so
        // convert it to a PNG file on the client before upload.  We have to restrict the quality to keep the cconversion
        // time reasonable.
        console.log('Need to convert HEIC')
        try {
          blob = file.slice(0, file.size, 'image/heic')

          const png = await window.heic2any({
            blob,
            toType: 'image/jpeg',
            quality: 0.92,
          })

          // Now we have png which is a Blob.
          console.log('Converted HEIC to PNG', png.size, png.type, png)
          blob = png
        } catch (e) {
          // We couldn't convert to PNG. We can't use it.
          console.log('Failed to convert HEIC to PNG', e)
          this.$emit('heicerror')
          blob = null
        }
      } else {
        blob = file
      }

      let resized = blob

      if (blob) {
        // We resize ourselves, because Filepond isn't always doing it and its error handling is poor.
        try {
          console.log('Resize', blob)
          const img = new Image()
          console.log('Convert blob to url')
          const urlCreator = window.URL || window.webkitURL
          console.log('Create img')
          img.src = urlCreator.createObjectURL(blob)

          await img.decode()

          console.log('Image loaded, resize')
          const canvas = document.createElement('canvas')
          const maxWidth = 800
          const maxHeight = 800
          let width = img.width
          let height = img.height

          // Calculate the new dimensions, maintaining the aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }

          // Set the canvas dimensions to the new dimensions
          canvas.width = width
          canvas.height = height

          // Draw the resized image on the canvas
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Get the resized image back as a Blob.
          const p = new Promise((resolve, reject) => {
            canvas.toBlob((resized) => {
              console.log('Resized', resized)
              resolve(resized)
            }, 'image/png')
          })

          resized = await p
          console.log('Resized', blob?.size, blob?.type)
        } catch (e) {
          // We failed to resize - we'll upload the original.
          console.log('Resize failed', e)
        }
      }

      if (resized) {
        data.append('photo', resized, 'photo')
        data.append(this.imgflag, true)
        data.append('imgtype', this.imgtype)
        data.append('ocr', this.ocr)
        data.append('identify', this.identify)

        if (this.msgid) {
          data.append('msgid', this.msgid)
        } else if (this.groupid) {
          data.append('groupid', this.groupid)
        }
      }

      try {
        // It would be nice to have a progress indicator, but this doesn't immediately appear to be
        // available using fetch().  So we don't specify onUpLoadProgress.
        const ret = await this.imageStore.postForm(data)

        if (ret.ret === 0) {
          this.imageid = ret.id
          this.imagethumb = ret.paththumb
          this.image = ret.path

          if (this.ocr) {
            this.ocred = ret.ocr
          }

          if (this.identify) {
            this.identified = ret.items
          }

          load(ret.id)
        } else {
          error(ret.status === 200 ? ret.status : 'Network error ' + ret.status)
        }
      } catch (e) {
        error('Network error ' + e.mesage)
      }

      return {
        abort: () => {
          // We don't need to do anything - the server will tidy up hanging images.
          abort()
        },
      }
    },
    load(uniqueFileId, load, error) {},
    fetch(url, load, error, progress, abort, headers) {},
    restore(uniqueFileId, load, error, progress, abort, headers) {},
    revert(uniqueFileId, load, error) {},

    processed(error, file) {
      if (!error) {
        this.$emit(
          'photoProcessed',
          this.imageid,
          this.imagethumb,
          this.image,
          this.ocred,
          this.identified
        )

        if (!this.multiple) {
          // Only one, so the allProcessed event isn't fired by pond.
          this.allProcessed()
        }
      } else {
        console.error('Failed to process file', error, file)
        this.error(error)
      }
    },
    addFile(f) {
      this.$refs.pond.addFile(f)
    },
    allProcessed() {
      this.composeStore.uploading = false
      this.$emit('allProcessed')
    },
    detector(source, type) {
      // This function is never executed...
      return new Promise((resolve, reject) => {
        console.log(source, type)
        if (source.name.includes('.heic')) {
          // This is not detected automatically.
          type = 'image/heic'
        }

        resolve(type)
      })
    },
    validateType(source, type) {
      const p = new Promise((resolve, reject) => {
        // Not all browsers set the MIME type correctly, so we have a custom validator to force it from the filename.
        if (source.name.toLowerCase().includes('.heic')) {
          resolve('image/heic')
        } else {
          resolve(type)
        }
      })

      return p
    },
    error(e, file) {
      console.log('Failed to process file for upload', e, file)
      Sentry.captureMessage('Failed to process file for upload', e?.message)
      this.$emit('error', e)
    },
  },
}
</script>
<style scoped lang="scss">
:deep(.filepond--root) {
  .filepond--drop-label {
    background-color: $colour-success-bg;

    label {
      font-weight: bold;
    }

    .btn {
      background-color: $colour-success !important;
      border-color: $colour-success !important;
      color: $color-white !important;

      &:hover {
        background-color: $colour-success-hover !important;
      }
    }
  }
}
</style>
