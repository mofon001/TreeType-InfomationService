import { ParamsModule } from "../../modules/ParamsModule";
import { ContentsModule } from "../../modules/ContentsModule";
import { appManager } from "../../AppManager";

declare var adsbygoogle: unknown;
declare interface Window {
  adsbygoogle: {}[];
}
declare var window: Window;

const paramsModule = appManager.getModule(ParamsModule);

//パラメータの読み出し
let adSenseValue: { top: string; bottom: string } | null = null;
const loadAdParam = async () => {
  adSenseValue = (await paramsModule.getGlobalParam(
    "ADSENSE_DATA"
  )) as typeof adSenseValue;
};
loadAdParam();

//コンテンツモジュールに割り込み設定
const contentsModule = appManager.getModule(ContentsModule);
contentsModule.addEventListener("drawContents", (client, id) => {
  if (adSenseValue) {
    let flag = false;
    const top = adSenseValue.top;
    if (top) {
      const v =
        (client.querySelector("[data-adsense=top]") as HTMLDivElement) ||
        document.createElement("div");
      v.style.maxWidth = "100%";
      v.style.minHeight = "2em";
      v.dataset.adsense = "top";
      v.innerHTML = top;
      client.insertBefore(v, client.firstChild);
      flag = true;
    }
    const bottom = adSenseValue.bottom;
    if (bottom) {
      const v =
        (client.querySelector("[data-adsense=bottom]") as HTMLDivElement) ||
        document.createElement("div");
      v.style.maxWidth = "100%";
      v.dataset.adsense = "bottom";
      v.style.minHeight = "2em";
      v.innerHTML = bottom;
      client.appendChild(v);
      flag = true;
    }

    if (flag) {
     // setTimeout(function() {
        try {
          (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          //empty
        }
   //   }, 0);
    }
  }
});
