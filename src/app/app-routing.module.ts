import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'webcam',
        loadChildren: () => import('./webcam/webcam.module').then((m) => m.WebcamModule),
      },
      {
        path: '',
        redirectTo: '/webcam',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
