import axios from 'axios'

import {bot,chat_id} from '../helpers/consts'

const telegram_url=`https://api.telegram.org/bot${bot}/sendMessage?chat_id=${chat_id}&text=`

export const telegramAxios = axios.create({
    baseURL:telegram_url
})
