import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Include touch support on the phone - material design (https://material.angular.io/guide/getting-started)
import 'hammerjs';

import { AppModule } from './app/app.module';
import { environment } from './app/environment/environment';

if (environment.production) { // if compile with ng build --prod
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
