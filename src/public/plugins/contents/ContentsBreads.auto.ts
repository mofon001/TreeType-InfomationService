/**
 *表示用パンくずリストプラグイン
 */

import { ContentsModule, TreeContents } from "../../Contents/ContentsModule";
import "./ContentsBreads.auto.scss";
import { ContentsCacheModule } from "./ContentsCache.auto";
import { appManager } from "../../Manager/FrontManager";

const contentsModule = appManager.getModule(ContentsModule);
const contentsCacheModule = appManager.getModule(ContentsCacheModule);

contentsModule.addEventListener("drawContents", (client, id) => {
  const contentsPage = client.querySelector("[data-type=ContentsPage]");
  if (contentsPage) {
    //パンくず領域の作成
    const breadContents = document.createElement("div");
    breadContents.dataset.style = "BreadContents";
    let parent:
      | TreeContents
      | undefined
      | null = contentsCacheModule.findTreeContents(id);
    if (!parent) return;
    while ((parent = parent.parent)) {
      //SEO対策のためaタグを生成
      const link = document.createElement("a");
      const id = parent.id;
      link.href = "?p="+id;
      link.innerText = parent.title;
      link.addEventListener("click", (e) => {
        contentsModule.selectContents(id);
        e.preventDefault();
      });
      breadContents.insertBefore(link, breadContents.firstChild);
    }
    contentsPage.insertBefore(breadContents, contentsPage.firstChild);
  }
});
