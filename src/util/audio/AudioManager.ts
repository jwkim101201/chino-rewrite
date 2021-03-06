import { Manager } from "erela.js";
import {Payload} from "erela.js/structures/Manager";
import ChinoClient from "../ChinoClient";
import config from '../../../config.json'
import {Collection, Message} from "discord.js";

export default class AudioManager extends Manager {
    client: ChinoClient
    npMessageMap = new Collection<string, Message>()

    constructor(client: ChinoClient) {
        super({
            send(id: string, payload: Payload) {
                const guild = client.guilds.cache.get(id)
                if (guild) guild.shard.send(payload)
            },
            nodes: config.audio.nodes
        })
        this.client = client
        client.on('raw', payload => this.updateVoiceState(payload))

        this.on('nodeRaw',async (payload: any) => {
            if (payload.op === 'playerUpdate') {
                const NowPlaying = require('../../commands/audio/now').default

                const guild = client.guilds.cache.get(payload.guildId)
                const msg = this.npMessageMap.get(payload.guildId)
                if (!guild || !msg) return
                if (msg) {
                    if (!msg.deleted) {
                        await msg.edit(await NowPlaying.getEmbed(guild))
                    } else {
                        if (!msg.channel.deleted) {
                            await msg.channel.send(await NowPlaying.getEmbed(guild))
                        }
                    }
                }
            }
        })

        this.setupEvents()
    }

    private setupEvents() {
        this.on('playerCreate', player => console.log(`[MUSIC] Player created in guild ${player.guild}`))
        this.on('playerMove', (player, oldChannel, newChannel) => console.log(`[MUSIC] Player moved, guild: ${player.guild} old channel: ${oldChannel} new channel: ${newChannel}`))
        this.on('playerDestroy', player => console.log(`[MUSIC] Player destroyed in guild ${player.guild}`))
        this.on('nodeConnect', node => console.log(`[MUSIC] Connected to node ${node.options.host}:${node.options.port}`))
        this.on('nodeCreate', node => console.log(`[MUSIC] Created node ${node.options.host}:${node.options.port}`))
        this.on('trackStuck', (player, track, payload) => console.log(`[MUSIC] Track stuck on guild ${player.guild}, track: ${track.title}: ${payload.thresholdMs}`))
        this.on('trackError', (player, track, payload) => console.log(`[MUSIC] Error on playing track ${track.title} on guild ${player.guild}: ${payload.error}`))
    }
}
