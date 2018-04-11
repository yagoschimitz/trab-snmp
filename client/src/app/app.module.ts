import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';
import { NgxMaskModule } from 'ngx-mask';
import { FlotModule } from 'ng2modules-flot';

import { AppComponent } from './app.component';
import { DeviceComponent } from './device/device.component';

@NgModule({
  declarations: [
    AppComponent,
    DeviceComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    FlotModule,
    NgxMaskModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
