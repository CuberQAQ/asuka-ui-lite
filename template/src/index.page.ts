import { createWidget, widget, prop, align_center } from '@zos/ui';
import { getDeviceInfo } from '@zos/device';

BasePage({
  build() {
    const { width, height } = getDeviceInfo();
    createWidget(widget.TEXT, {
      x: width / 2,
      y: height / 2,
      w: width,
      h: 100,
      text_size: 32,
      text: 'Asuka UI Lite',
      color: 0xffffff,
      align_h: align_center,
      align_v: align_center,
    });
  },
});
