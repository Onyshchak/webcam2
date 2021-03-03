import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {WebcamRoutingModule} from './webcam-routing.module';
import { WebcamComponent } from './webcam.component';
import { CameraComponent } from './components/camera/camera.component';



@NgModule({
  declarations: [
    WebcamComponent,
    CameraComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    WebcamRoutingModule
  ]
})
export class WebcamModule { }
