# 潜水艦（仮）

対人戦または対コンピュータ戦が可能な潜水艦ゲームです．

<a href="https://mkybdevssubmarine.web.app/">ここ</a>から遊べます．

## ゲームのルール・操作方法
<a href="https://mkybdevssubmarine.web.app/">ゲーム</a>内の「遊び方」を参照してください．

## 技術的背景
「プログラミング演習」の最終課題のうち，標準ゲームのプレイヤ・サーバとして作成しました．
バックエンド部分は JavaScript (Pure) で，フロントエンド部分は HTML/CSS を用いて実装しています．
また，通信技術として Firebase Cloud FireStore を，アプリのデプロイには Firebase Hosting を利用しています．

プレイヤは Web 上の UI で直接操作します．対人戦では，ルームを作成したり，ルームに参加したりすることで対戦相手を探します．コンピュータ戦では，コンピュータが自動的にプレイヤとなります．現段階では，ランダムな動きをする EASY モードのみ選択できます．

## ディレクトリ構成（抜粋）
├── README.md
<br>
├── firebase.json&emsp;# Firebase の設定
<br>
├── firestore.rules&emsp;# Firebase Cloud FireStore のセキュリティルール
<br>
├── functions&emsp;# Firebase Cloud Functions（未使用）
<br>
├── public&emsp;# フロントエンド部分
<br>
&emsp;&emsp;&emsp;&emsp;├── font&emsp;# フォント
<br>
&emsp;&emsp;&emsp;&emsp;├── images&emsp;# 画像
<br>
&emsp;&emsp;&emsp;&emsp;├── index.html&emsp;# メインページ
<br>
&emsp;&emsp;&emsp;&emsp;├── index.css&emsp;# メインページのスタイル
<br>
&emsp;&emsp;&emsp;&emsp;├── roomInit.js&emsp;# ルーム作成
<br>
&emsp;&emsp;&emsp;&emsp;├── gameInit.js&emsp;# ゲームの初期化
<br>
&emsp;&emsp;&emsp;&emsp;├── gameInitCpu.js&emsp;# 対コンピュータ戦の初期化
<br>
&emsp;&emsp;&emsp;&emsp;├── game.js&emsp;# ゲームの進行

## クレジット
<a href="https://www.freepik.com/free-vector/vector-pixel-mouse-cursors-white-hand-drag-arrow-pointer_11053927.htm#query=pixel%20arrows&position=3&from_view=keyword&track=ais">Image by macrovector</a> on Freepik

<a href="https://hpgpixer.jp/" target="_blank">ピクセルガロー</a>

<a href="https://dotown.maeda-design-room.net/">DOTOWN</a>

<a href="https://dot-illust.net/">DOT ILLUST</a>

<a href="https://itouhiro.hatenablog.com/entry/20130602/font">PixelMplus</a>