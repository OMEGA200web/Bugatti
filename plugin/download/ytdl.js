//  

const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

module.exports = {
    type: 'download',
    command: ['ytmp4', 'ytmp3'],
    operate: async (context) => {
        const { sam, m, q, prefix, command, reaction, reply, getRandom, Format } = context;

        if (!q) {
            await reply(`Add input, Example: *${prefix + command} https://youtu.be/7U20i3bMX10?si=5MwAl2F_mB98SXfZ*`);
            await reaction(m.chat, "❗");
            return;
        }

        async function ytmp3(ptz, m, url) {
            try {
                const sender = m.sender;
                const info = await ytdl.getInfo(url);
                let a = path.resolve(__dirname, "../../grab/src/" + randomBytes(4).toString('hex') + ".mp3");
                await new Promise((resolve, reject) => {
                    ytdl(url, { filter: "audioonly" })
                        .pipe(fs.createWriteStream(a))
                        .on("finish", resolve)
                        .on("error", reject);
                });
                await sam.sendMessage(m.chat, { audio: fs.readFileSync(a), mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
            } catch (e) {
                console.error(e);
                return {
                    status: 'error',
                    message: 'An error occurred while retrieving video information'
                };
            }
        }

        async function ytmp4(url) {
            try {
                const { videoDetails } = await ytdl.getInfo(url, { lang: "id" });
                const stream = ytdl(url, { filter: "videoandaudio" });
                const chunks = [];
                stream.on("data", (chunk) => { chunks.push(chunk); });
                await new Promise((resolve, reject) => {
                    stream.on("end", resolve);
                    stream.on("error", reject);
                });
                const buffer = Buffer.concat(chunks);
                return {
                    meta: {
                        title: videoDetails.title,
                        channel: videoDetails.author.name,
                        seconds: videoDetails.lengthSeconds,
                        description: videoDetails.description,
                        image: videoDetails.thumbnails.slice(-1)[0].url,
                    },
                    buffer: buffer,
                    size: buffer.length,
                };
            } catch (error) {
                throw error;
            }
        }

        try {
            await reaction(m.chat, "⬇️");

            if (command === "ytmp4") {
                let obj = await ytmp4(q);
                let title = obj.meta.title;
                let channel = obj.meta.channel;
                let duration = obj.meta.seconds;
                let desk = obj.meta.description;
                let cap = `\`\`\`
▹ Title : ${title}

▾ Ch : ${channel}
▾ Drt : ${duration}

© Bugatti 
\`\`\``
                await sam.sendFile(m.chat, obj.buffer, `${title}.mp4`, cap, m);
            } else if (command === "ytmp3") {
                let res = await ytmp3(tdx, m, q);
                if (res instanceof Error) return reply("Error: " + res.message);
            }

            await reaction(m.chat, "✅");
        } catch (error) {
            console.error('Error:', error);
            await reply('Failed to download the YouTube video. Please try again later.');
            await reaction(m.chat, "❌");
        }
    }
};