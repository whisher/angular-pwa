import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import { SwPush } from '@angular/service-worker';
import { PushService } from '../../services/push.service';
import { ConfigService } from '../../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-control-push',
  templateUrl: './control-push.component.html',
  styleUrls: ['./control-push.component.css']
})
export class ControlPushComponent implements OnInit {
  private VAPID_PUBLIC_KEY: string;
  public isSubscribe: boolean;

  constructor(private pushService: PushService, private configService: ConfigService, private swPush: SwPush, public snackBar: MatSnackBar) {}

  ngOnInit() { 
    this.VAPID_PUBLIC_KEY = this.configService.get('VAPID_PUBLIC_KEY');
    this.subscribeToPush();
  }

  subscribeToPush() {
    // Requesting messaging service to subscribe current client (browser)
    this.swPush.requestSubscription({
      serverPublicKey: this.VAPID_PUBLIC_KEY
    }).then(pushSubscription => {
        // Passing subscription object to our backend
        this.pushService.addSubscriber(pushSubscription).subscribe(
          res => {
            console.log('[App] Successful add subscriber request answer', res)
            this.subscribeToShowMessages();
            this.isSubscribe = true;
          },
          err => console.log('[App] Failed add subscriber request failed', err)
        );
    })
    .catch(err => {
      console.error(err);
    })
  }

  unsubscribeFromPush() {
    // Get active subscription
    this.swPush.subscription
      .take(1)
      .subscribe(pushSubscription => {
        console.log('[App] pushSubscription', pushSubscription)
        // Delete the subscription from the backend
        this.pushService.deleteSubscriber(pushSubscription).subscribe(
          res => {
            console.log('[App] Delete subscriber request answer', res);
            // Unsubscribe current client (browser)
            pushSubscription.unsubscribe()
              .then(success => {
                console.log('[App] Unsubscription successful', success)
                this.isSubscribe = false;
              })
              .catch(err => console.log('[App] Unsubscription failed', err))
          },
          err => console.log('[App] Delete subscription request failed', err)
        );
      });
  }

  subscribeToShowMessages() {
    this.swPush.messages.subscribe(message => {
      console.log('[App] Push message received', message['message']);
      let snackBarRef = this.snackBar.open(message['message'], null, {
        duration: 2000
      });
    });
  }
}