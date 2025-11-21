# Soul:23 coming soon page

A responsive landing page built with Bootstrap 4 that keeps a countdown and lets visitors request updates via the email form. A live preview is available at https://solu23.cloud.

**Author:** Marco Gallegos

## Subscription form

The notification form is purely client-side; fill it out, but no emails are sent or stored until you connect it to your own backend.

## Changing the countdown target

The timer reads its target date from the `data-date` attribute on the `#countdown-timer` element in `index.html`. Update that attribute to any valid timestamp, for example:

```html
<div id="countdown-timer" data-date="January 17, 2025 03:24:00">
```

If you prefer keeping the attribute dynamic, reassign the `countDownDate` variable inside `js/countdown.js` before the interval starts.
