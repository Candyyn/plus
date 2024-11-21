import { compile } from 'ass-compiler'
import {
  clear,
  createPause,
  createPlay,
  createResize,
  createSeek,
} from './internal.js'
import { $fixFontSize } from './renderer/font-size.js'

/**
 * @typedef {object} ASSOption
 * @property {HTMLElement} [container] The container to display subtitles.
 * Its style should be set with `position: relative` for subtitles will absolute to it.
 * Defaults to `video.parentNode`
 * @property {`${"video" | "script"}_${"width" | "height"}`} [resampling="video_height"] Text calculation
 * @property {bool} [native=false]
 * When script resolution(PlayResX and PlayResY) don't match the video resolution, this API defines how it behaves.
 * However, drawings and clips will be always depending on script origin resolution.
 * There are four valid values, we suppose video resolution is 1280x720 and script resolution is 640x480 in following situations:
 * + `video_width`: Script resolution will set to video resolution based on video width. Script resolution will set to 640x360, and scale = 1280 / 640 = 2.
 * + `video_height`(__default__): Script resolution will set to video resolution based on video height. Script resolution will set to 853.33x480, and scale = 720 / 480 = 1.5.
 * + `script_width`: Script resolution will not change but scale is based on script width. So scale = 1280 / 640 = 2. This may causes top and bottom subs disappear from video area.
 * + `script_height`: Script resolution will not change but scale is based on script height. So scale = 720 / 480 = 1.5. Script area will be centered in video area.
 */

export default class ASS {
  #store = {
    /** @type {HTMLVideoElement} */
    video: null,
    /** the box to display subtitles */
    box: document.createElement('div'),
    container: null,
    /**
     * video resize observer
     * @type {ResizeObserver}
     */
    observer: null,
    scale: 1,
    width: 0,
    height: 0,
    /** resolution from ASS file, it's PlayResX and PlayResY */
    scriptRes: {},
    /** resolution from ASS file, it's LayoutResX and LayoutResY */
    layoutRes: {},
    /** resolution after resampling */
    resampledRes: {},
    /** current index of dialogues to match currentTime */
    index: 0,
    /** @type {boolean} ScaledBorderAndShadow */
    sbas: true,
    /** @type {import('ass-compiler').CompiledASSStyle} */
    styles: {},
    /** @type {import('ass-compiler').Dialogue[]} */
    dialogues: [],
    /**
     * active dialogues
     * @type {import('ass-compiler').Dialogue[]}
     */
    actives: [],
    /** record dialogues' position */
    space: [],
    requestId: 0,
    delay: 0,
    native: false,
  }

  container
  #play

  #pause

  #seek

  #resize

  /**
   * Initialize an ASS instance
   * @param {string} content ASS content
   * @param {HTMLVideoElement} video The video element to be associated with
   * @param {ASSOption} [option]
   * @returns {ASS} subs
   * @example
   *
   * HTML:
   * ```html
   * <div id="container" style="position: relative;">
   *   <video
   *     id="video"
   *     src="./example.mp4"
   *     style="position: absolute; width: 100%; height: 100%;"
   *   ></video>
   *   <!-- ASS will be added here -->
   * </div>
   * ```
   *
   * JavaScript:
   * ```js
   * import ASS from 'assjs';
   *
   * const content = await fetch('/path/to/example.ass').then((res) => res.text());
   * const ass = new ASS(content, document.querySelector('#video'), {
   *   container: document.querySelector('#container'),
   * });
   * ```
   */
  constructor(
    content,
    video,
    { container = video.parentNode, resampling, native } = {},
  ) {
    this.#store.native = native
    this.#store.video = video
    if (!container) throw new Error('Missing container.')

    this.container = container

    const { info, width, height, styles, dialogues } = compile(content)
    this.#store.container = this.container
    this.#store.sbas = /yes/i.test(info.ScaledBorderAndShadow)
    this.#store.layoutRes = {
      width: info.LayoutResX * 1 || video.videoWidth || video.clientWidth,
      height: info.LayoutResY * 1 || video.videoHeight || video.clientHeight,
    }
    this.#store.scriptRes = {
      width: width || this.#store.layoutRes.width,
      height: height || this.#store.layoutRes.height,
    }
    this.#store.styles = styles
    this.#store.dialogues = dialogues.map(dia =>
      Object.assign(dia, {
        effect: ['banner', 'scroll up', 'scroll down'].includes(
          dia.effect?.name,
        )
          ? dia.effect
          : null,
        align: {
          // 0: left, 1: center, 2: right
          h: (dia.alignment + 2) % 3,
          // 0: bottom, 1: center, 2: top
          v: Math.trunc((dia.alignment - 1) / 3),
        },
      }),
    )

    if ($fixFontSize) {
      container.append($fixFontSize)
    }

    const { box } = this.#store
    box.className = 'ASS-box'
    container.append(box)

    this.#play = createPlay(this.#store)
    this.#pause = createPause(this.#store)
    this.#seek = createSeek(this.#store)
    console.log('store native?', this.#store.native)
    if (this.#store.native) {
      this.#play()
    }
    else {
      video.addEventListener('play', this.#play)
      video.addEventListener('pause', this.#pause)
      video.addEventListener('playing', this.#play)
      video.addEventListener('waiting', this.#pause)
      video.addEventListener('seeking', this.#seek)
    }

    this.#resize = createResize(this, this.#store)
    this.#resize()
    this.resampling = resampling

    const observer = new ResizeObserver(this.#resize)
    observer.observe(video?.classList ? video : container)
    this.#store.observer = observer

    return this
  }

  /**
   * Desctroy the ASS instance
   * @returns {ASS} subs
   */
  destroy() {
    const { video, box, observer } = this.#store
    this.#pause()
    clear(this.#store)
    if (!this.#store.native) {
      video.removeEventListener('play', this.#play)
      video.removeEventListener('pause', this.#pause)
      video.removeEventListener('playing', this.#play)
      video.removeEventListener('waiting', this.#pause)
      video.removeEventListener('seeking', this.#seek)
    }

    if ($fixFontSize) {
      $fixFontSize.remove()
    }
    box.remove()
    observer.observe(video?.classList ? video : this.container)

    this.#store.styles = {}
    this.#store.dialogues = []

    return this
  }

  /**
   * Show subtitles in the container
   * @returns {ASS} subs
   */
  show() {
    this.#store.box.style.visibility = 'visible'
    return this
  }

  /**
   * Hide subtitles in the container
   * @returns {ASS} subs
   */
  hide() {
    this.#store.box.style.visibility = 'hidden'
    return this
  }

  #resampling = 'video_height'

  /** @type {ASSOption['resampling']} */
  get resampling() {
    return this.#resampling
  }

  set resampling(r) {
    if (r === this.#resampling) return

    if (/^(video|script)_(width|height)$/.test(r)) {
      this.#resampling = r
      this.#resize()
    }
  }

  /** @type {number} Subtitle delay in seconds. */
  get delay() {
    return this.#store.delay
  }

  set delay(d) {
    if (typeof d !== 'number') return
    this.#store.delay = d
    this.#seek()
  }

  // addDialogue(dialogue) {
  // }
}
