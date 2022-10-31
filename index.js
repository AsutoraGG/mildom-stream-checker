import axios from "axios";
import { readFileSync } from 'fs';
import chalk from 'chalk'
import gradation from 'gradient-string';
import { Webhook, MessageBuilder } from 'discord-webhook-node';

console.clear();
process.stdout.write('\x1b]2;' + "github.com/AsutoraGG" + '\x1b\x5c'); //TITLE

console.log(chalk.blue('[INFO]  : ') + chalk.white('プログラムを起動....'));

let CONFIG_PATH = './config.json';
const config = JSON.parse(readFileSync(CONFIG_PATH));
const UserID = config.UserID;
const WebHook = config.Discord.WebHook_URL;
const RoleName = config.Discord.Notification.RoleName;
const Notification = config.Discord.Notification.Notification;

if(Notification) {
    if(RoleName) {
        console.log(chalk.blue('[INFO]  : ') + chalk.white('配信通知が現在許可されています。配信が開始、又は終了したときに"@' + RoleName + '"でメンションされます'));
    } else {
        console.log(chalk.blue('[INFO]  : ') + chalk.white('配信通知が現在許可されています。配信が開始、又は終了したら"@here"でメンションされます'));
    }
} else {
    console.log(chalk.blue('[INFO]  : ') + chalk.white('配信通知が現在許可されていません。配信が開始、又は終了したらEmbedのみ送信されます'));
}
console.log('')


if(!UserID) {
    console.log(chalk.red('[ERROR] : ') + chalk.white('config.jsonが更新されていません! ユーザーIDはURLの数字8桁です'));
    process.exit(0);
} else if(!WebHook) {
    console.log(chalk.red('[ERROR] : ') + chalk.white('config.jsonが更新されていません! WebHookはサーバーの設定から作成できます'));
    process.exit(0);
}

const Hook = new Webhook(WebHook);

let USERDATA_URL = `https://cloudac.mildom.com/nonolive/gappserv/user/profileV2?user_id=${UserID}&__platform=web`;

console.log(chalk.blue('[INFO]  : ') + chalk.white('APIから情報を取得中...'));


function GetTime() {
    var Data = new Date();
    var Hour = Data.getHours();
    var Min = Data.getMinutes();

    return Hour + '時' + Min + '分'
}


let LiveData = []; // true又はfalseを入れる

axios.get(USERDATA_URL).then(r => { //　最初にデータをプッシュする
    LiveData.push(r.data.body.user_info.anchor_live)
})

function request() {
    console.clear();

    console.log(gradation('magenta', 'cyan')("███████╗████████╗██████╗ ███████╗ █████╗ ███╗   ███╗     ██████╗██╗  ██╗███████╗ ██████╗██╗  ██╗███████╗██████╗ "))
    console.log(gradation('magenta', 'cyan')("██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗████╗ ████║    ██╔════╝██║  ██║██╔════╝██╔════╝██║ ██╔╝██╔════╝██╔══██╗"))
    console.log(gradation('magenta', 'cyan')("███████╗   ██║   ██████╔╝█████╗  ███████║██╔████╔██║    ██║     ███████║█████╗  ██║     █████╔╝ █████╗  ██████╔╝"))
    console.log(gradation('magenta', 'cyan')("╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║    ██║     ██╔══██║██╔══╝  ██║     ██╔═██╗ ██╔══╝  ██╔══██╗"))
    console.log(gradation('magenta', 'cyan')("███████║   ██║   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║    ╚██████╗██║  ██║███████╗╚██████╗██║  ██╗███████╗██║  ██║"))
    console.log(gradation('magenta', 'cyan')("╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝"))

    axios.get(USERDATA_URL).then(Response => {
        let data = Response.data;
    
        if(data.code > 0) { // codeが0以上だった場合はエラー
            if(data.code === 35003) { // Invalid User ID
                console.log(chalk.red('[ERROR] : ') + chalk.white('ユーザーIDが無効です。IDを再度確認しconfig.jsonを更新してください'));
            } else {
                if(data.message === '') { //messageが空白だった場合エラーコードだけに
                    console.log(chalk.red('[ERROR] : ') + chalk.white('不明なエラー!　エラーコード: ') + data.code)
                } else {
                    console.log(chalk.red('[ERROR] : ') + chalk.white('不明なエラー!　エラーコード: ') + data.code + ' メッセージ: ' + data.message);
                }
            };
            process.exit(0);
        }
    
        //anchor_live
        let body = data.body.user_info;

        Hook.setAvatar(body.avatar);
        Hook.setUsername(body.loginname);

        const StartStreamEmbed = new MessageBuilder()
        .setTitle('配信が開始されました!')
        .setURL(`https://www.mildom.com/${body.user_id}`)
        .setColor('#FF3333')
        .setDescription('『' + body.anchor_intro + '』で配信が開始しました')
        .setThumbnail(body.pic)

        const EndStreamEmbed = new MessageBuilder()
        .setTitle('配信は終了しました')
        .setURL(`https://www.mildom.com/${body.user_id}`)
        .setDescription('『' + body.anchor_intro + '』で配信は終了しました')
        .setColor('#33FFF0')

        if(LiveData[0] != body.anchor_live) { // 現在ライブされているけどさっきまではライブされていなかったかを確認
            if(body.anchor_live === 11) {
                Hook.send(StartStreamEmbed)
                if(Notification === true) { //　通知が許可されていたら
                    Hook.send('@here')
                }
            } else if(body.anchor_live === 13) {
                Hook.send(EndStreamEmbed)
                if(Notification === true) { //　通知が許可されていたら
                    Hook.send('@here')
                }
            }
        }

        console.log('\n----- ' + chalk.yellow.bold('配信者情報') + ' -----');
        console.log(chalk.green('-UserID') + ': "' + body.user_id + '"');
        console.log(chalk.green('-UserName') + ': "'  + body.loginname + '"');
        console.log(chalk.green('-AvatarURL') + ': '  + body.avatar);
        console.log(chalk.green('-Level') + ': lv.'  + body.level);
        console.log(chalk.green('-Follower') + ': '  + body.fans + "人");
    
        if(body.anchor_live === 11) {
            LiveData.splice(0); //配列の中身をクリアする
            LiveData.push(body.anchor_live);

            console.log('\n----- ' + chalk.yellow.bold('配信情報') + ' -----');
            console.log(chalk.green('-Status') + ': ' + "配信をしています。");
            console.log(chalk.green('-Stream URL') + ': ' + 'https://www.mildom.com/' + body.user_id);
            console.log(chalk.green('-Live Title') + ': ' + body.anchor_intro);
            if(body.viewers === undefined) {
                console.log(chalk.green('-Viewers') + ': 0人');
            } else {
                console.log(chalk.green('-Viewers') + ': ' + body.viewers + '人');
            }
        } else {
            LiveData.splice(0);
            LiveData.push(body.anchor_live);
            // console.log('pushしました : ' + LiveData[0])

            console.log('\n----- ' + chalk.yellow.bold('配信情報') + ' -----');
            console.log(chalk.green('-Status') + ': ' + "配信をしていせん。");
        }
        console.log('\n【 最終更新時間: ' + chalk.blue(GetTime()) + '　】(1分ごとに更新されます)')
        // console.log(LiveData[0])
    })
}

console.log(chalk.blue('[INFO]  : ') + chalk.white('APIから情報を取得しました。'));
setTimeout(() => request(), 2000);

setInterval(() => {
    request();
}, 60000 * 1); // 1min = 60000 * 1

