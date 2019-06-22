import { JSDOM } from "jsdom";
import * as util from "util";
import * as fs from "fs";
import * as path from "path";
import { sprintf } from "sprintf";
import express = require("express");
import { Module } from "./Module";

interface FileInfo {
  dir: string;
  name: string;
  date: Date;
}

export class HtmlCreater {
  private jsdom?: JSDOM;
  private links:string[] = [];
  private baseUrl?:string
  private req?:express.Request
  public getDom(){
    return this.jsdom as JSDOM;
  }
  public getDocument(){
    return this.getDom().window.document;
  }
  public getRequest(){
    return this.req as express.Request;
  }
  public async output(
    req:express.Request,
    res: express.Response,
    baseUrl: string,
    rootPath: string,
    indexPath: string,
    cssPath: string[],
    jsPath: string[],
    priorityJs: string[],
    modules:Module[],

  ): Promise<boolean> {
    if (!await this.openTemplate(indexPath)) return false;
    this.req = req;
    this.baseUrl = baseUrl;
    const cssFiles = this.getFileInfo(rootPath, cssPath,".css");
    const jsFiles = this.getFileInfo(rootPath, jsPath,".js");

    //JSを優先順位に従って並び替え
    jsFiles.sort(
      (a, b): number => {
        const v1 = priorityJs.indexOf(a.name);
        const v2 = priorityJs.indexOf(b.name);
        return v2 - v1;
      }
    );
    //必要なファイルを追加
    this.addScript(jsFiles);
    this.addCSS(cssFiles);

    this.addLink(jsFiles.map(v => v.dir+"/"+ v.name),'script');
    this.addLink(cssFiles.map(v => v.dir+"/"+ v.name),'style');

    for(const module of modules){
      if(module.onCreateHtml){
        await module.onCreateHtml(this);
      }
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=UTF-8",
      link: this.links
    });
    if(this.jsdom)
      res.end(this.jsdom.window.document.documentElement.outerHTML);

    return true;
  }

  public async openTemplate(indexPath: string) {
    try {
      const jsdom = await JSDOM.fromFile(indexPath);
      this.jsdom = jsdom;
      return true;
    } catch (e) {
      return false;
    }
  }
  addLink(files:string[],style:string){
    const links = this.links;
    const baseUrl = this.baseUrl;
    for (const file of files) {
      links.push(`<${baseUrl}${file}>;rel=preload;as=${style};`);
    }
  }
  addScript(files: FileInfo[]) {
    const jsdom = this.jsdom;
    if (!jsdom) return;
    const document = jsdom.window.document;
    const head = document.head;
    for (const file of files) {
      const node = document.createElement("script");
      node.type = "text/javascript";
      node.src = util.format(`${file.dir}/${file.name}`);
      head.appendChild(node);
    }
  }
  addCSS(files: FileInfo[]) {
    const jsdom = this.jsdom;
    if (!jsdom) return;
    const document = jsdom.window.document;
    const head = document.head;
    for (const file of files) {
      const node = document.createElement("link");
      node.rel = "stylesheet";
      node.href = util.format(`${file.dir}/${file.name}`);
      head.appendChild(node);
    }
  }
  getFileInfo(rootPath: string, srcPath: string[],type:string) {
    const fileInfos: FileInfo[] = [];
    //CSSファイルリストの読み込み
    for (let dir of srcPath) {
      try {
        const files = fs.readdirSync(`${rootPath}/${dir}`);
        for (const name of files) {
          if (path.extname(name).toLowerCase() === type) {
            const stat = fs.statSync(`${rootPath}/${dir}/${name}`);
            fileInfos.push({ dir, name, date: stat.mtime });
          }
        }
      } catch (e) {
        // continue
      }
    }
    this.addDateParam(fileInfos);
    return fileInfos;
  }
  //ファイル名に日付情報を追加
  addDateParam(files: FileInfo[]): void {
    for (const file of files) {
      const date = file.date;
      file.name += sprintf(
        "?ver=%04d%02d%02d%02d%02d%02d",
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      );
    }
  }
}