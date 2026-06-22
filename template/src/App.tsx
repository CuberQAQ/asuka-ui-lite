import { Scale, createWidget, widget, prop, align_center } from '@cuberqaq/asuka-ui-lite';
import { getDeviceInfo } from '@zos/device';

export default function App() {
  const { width, height } = getDeviceInfo();

  const w: Scale = 300;
  const h: Scale = 80;

  return createWidget(widget.TEXT, {
    x: width / 2,
    y: height / 2,
    w,
    h,
    text_size: 28,
    text: 'Hello Asuka UI Lite',
    color: 0xffffff,
    align_h: align_center,
    align_v: align_center,
  });
}
