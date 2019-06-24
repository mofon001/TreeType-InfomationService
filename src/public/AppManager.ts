import * as JWF from "javascript-window-framework";
import { AppModule } from "./AppModule";

/**
 *
 *
 * @export
 * @class AppManager
 */
export class AppManager {
  private modules: [typeof AppModule, AppModule][] = [];
  private adapter: JWF.Adapter;
  /**
   *Creates an instance of AppManager.
   * @memberof AppManager
   */
  public constructor() {
    //通信アダプタの作成
    this.adapter = new JWF.Adapter("./","IITS");
  }
  public getAdapter() {
    return this.adapter;
  }
  public getModule<T extends AppModule>(moduleType: {
    new (manager: AppManager): T;
  }): T {
    const modules = this.modules;
    const length = modules.length;
    for(let i=0;i<length;i++){
      if(modules[i][0] === moduleType)
        return modules[i][1] as T;
    }
    const module = new moduleType(this);
    this.modules.push([moduleType as typeof AppModule,module]);
    return module;
  }
}
