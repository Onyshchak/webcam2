import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-converter';
import '@tensorflow/tfjs-backend-webgl';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'WebCam';
  bodyPix = require('@tensorflow-models/body-pix');
  // latest snapshot
  imageBackgrounds: any[] = ['assets/img/windows.png', 'assets/img/ice.png', 'assets/img/summer.png'];
  selectedBackground: string;
  canvas: any = {};

  @ViewChild('video') video: ElementRef;
  ngVersion: string;
  streaming = false;
  error: any;
  private stream: MediaStream = null;
  canvasPerson;
  contextPerson;
  testCanvas;
  showTestCanvas: boolean;
  loading: boolean;
  backgroundDarkeningMask = null;
  imgData;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.imageBackgrounds.forEach(item => {
      this.canvas[item.id] = document.getElementById(item.id) as HTMLCanvasElement;
    });
    this.initVideo(null).then((r) => console.log(r));

    this.canvasPerson = document.getElementById('canvasPerson');
    this.testCanvas = document.getElementById('testCanvas');
    this.contextPerson = this.canvasPerson.getContext('2d');
  }

  async initVideo(e): Promise<any> {
    this.getMediaStream()
      .then(async (stream) => {
        this.stream = stream;
        this.streaming = true;
        const net = await bodyPix.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.75,
          quantBytes: 2
        });
        setInterval(async () => {
          if (this.selectedBackground) {
            const segmentation = await net.segmentPerson(this.video.nativeElement, {
              flipHorizontal: false,
              internalResolution: 'medium',
              segmentationThreshold: 0.7
            });
            const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
            const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
            const backgroundDarkeningMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor, false);
            this.contextPerson.globalCompositeOperation = 'destination-over';
            this.contextPerson.putImageData(backgroundDarkeningMask, 0, 0);
            this.contextPerson.globalCompositeOperation = 'source-in';
            createImageBitmap(this.video.nativeElement).then(imgBitmap => this.contextPerson.drawImage(imgBitmap, 0, 0));
          }
        }, 100);
      });
  }
  private getMediaStream(): Promise<MediaStream> {

    const video_constraints = { video: true };
    const _video = this.video.nativeElement;
    return new Promise<MediaStream>((resolve, reject) => {
      // (get the stream)
      return navigator.mediaDevices.
      getUserMedia(video_constraints)
        .then(stream => {
          (window as any).stream = stream; // make variable available to browser console
          _video.srcObject = stream;
          // _video.src = window.URL.createObjectURL(stream);
          _video.onloadedmetadata = function(e: any) { };
          _video.play();
          return resolve(stream);
        })
        .catch(err => reject(err));
    });
  }

  shot(): void {
    this.loading = true;
    this.loadImage().then(r => {
      this.showTestCanvas = true;
      this.loading = false;
    });
  }

  save(): void {
    const link = document.createElement('a');
    link.download = 'filename.png';
    link.href = this.testCanvas.toDataURL();
    link.click();
  }

  change(): void {
    this.showTestCanvas = false;
    this.imgData = null;
    // this.backgroundDarkeningMask
  }

  async loadImage(): Promise<any> {
    const net = await bodyPix.load({
      architecture: 'ResNet50',
      outputStride: 16,
      multiplier: 1,
      quantBytes: 1,
    });

    const segmentation = await net.segmentPerson(this.video.nativeElement, {
      flipHorizontal: true,
      internalResolution: 'full',
      segmentationThreshold: 0.5,
      maxDetections: 5,
      scoreThreshold: 0.61,
      nmsRadius: 21
    });

    // Convert the segmentation into a mask to darken the background.
    const foregroundColor = { r: 0, g: 0, b: 0, a: 255 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundDarkeningMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor, false);
    this.backgroundDarkeningMask = backgroundDarkeningMask;
    this.composite(backgroundDarkeningMask).then(res => console.log(res));
  }

  async composite(backgroundDarkeningMask): Promise<void> {
    if (!backgroundDarkeningMask) { return; }

    const ctx = this.testCanvas.getContext('2d');
    // composite the segmentation mask on top
    if (!this.imgData) {
      ctx.globalCompositeOperation = 'destination-over';
      ctx.putImageData(backgroundDarkeningMask, 0, 0);
      // composite the frame
      ctx.globalCompositeOperation = 'source-in';
      createImageBitmap(this.video.nativeElement).then(imgBitmap => ctx.drawImage(imgBitmap, 0, 0));
      this.imgData = ctx.getImageData(0, 0, 640, 480);
    }
    ctx.putImageData(this.imgData);
    const background = new Image();
    background.src = this.selectedBackground;
    background.onload = () => {
      ctx.globalCompositeOperation = 'destination-over';
      ctx.drawImage(background, 0, 0);
    };
  }

  setBackground(url: string): void {
    this.selectedBackground = url;
    if (this.showTestCanvas) {
      this.composite(this.backgroundDarkeningMask).then(res => console.log(res));
    }
  }
}
