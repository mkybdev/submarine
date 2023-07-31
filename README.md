# 潜水艦（仮）

対人戦または対コンピュータ戦が可能な潜水艦ゲームです．

<a href="https://mkybdevssubmarine.web.app/">ここ</a>から遊べます．

## ゲームのルール・操作方法
<a href="https://mkybdevssubmarine.web.app/">ゲーム</a>内の「遊び方」を参照してください（文面は<a href="https://github.com/tkaneko/submarine-py/blob/b16fc761d0019e7d7bf3337d13e059476e0919f3/README.md">こちら</a>を元に作成させていただきました）．

## 技術的背景
「プログラミング演習」の最終課題のうち，標準ゲームのプレイヤ・サーバとして作成しました．
バックエンド部分は JavaScript (Pure) で，フロントエンド部分は HTML/CSS を用いて実装しています．
また，通信技術として Firebase Cloud FireStore を，アプリのデプロイには Firebase Hosting を利用しています．

プレイヤは Web 上の UI で直接操作します．対人戦では，ルームを作成したり，ルームに参加したりすることで対戦相手を探します．コンピュータ戦では，コンピュータが自動的にプレイヤとなります．現段階では，ランダムな動きをする EASY モードのみ選択できます．

## ディレクトリ構成（抜粋）
<pre>
├── README.md
├── functions           # Firebase Cloud Functions（未使用）
├── public              # フロントエンド部分
    ├── font            # フォント
    ├── images          # 画像
    ├── index.html      # メインページ
    ├── index.css       # メインページのスタイル
    ├── roomInit.js     # ルーム作成
    ├── gameInit.js     # ゲームの初期化
    ├── gameInitCpu.js  # 対コンピュータ戦の初期化
    ├── game.js         # ゲームの進行
</pre>

## 課題点
- 対人戦はとにかく通信が遅い
    - 特に攻撃するのに時間がかかる
    - ログを見る限り，何度も繰り返し同じ情報を送信してしまっている
    - データベースとの通信は最低限に抑えたい
- 他の人が作成したプレイヤを利用して対戦することができない
    - 課題の趣旨である「対戦フレームワーク部分を自分で作成したコードで置き換え，他の人が作った思考部分同士を対戦させられるようにする」ことに反している
    - 「コマンドモード」（CUIからのアクセスに対応し，データをブラウザ上のUIに反映する）の実装が求められる
        - ブラウザ上で完結できないか？
- コードが汚い
    - すみません

## クレジット
<a href="https://www.freepik.com/free-vector/vector-pixel-mouse-cursors-white-hand-drag-arrow-pointer_11053927.htm#query=pixel%20arrows&position=3&from_view=keyword&track=ais">Image by macrovector</a> on Freepik

<a href="https://hpgpixer.jp/" target="_blank">ピクセルガロー</a>

<a href="https://dotown.maeda-design-room.net/">DOTOWN</a>

<a href="https://dot-illust.net/">DOT ILLUST</a>

<a href="https://itouhiro.hatenablog.com/entry/20130602/font">PixelMplus</a>