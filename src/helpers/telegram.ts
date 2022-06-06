import {bot,chat_id} from './consts'
import {telegramAxios} from '../axiosConfig/axiosConfig'
import axios from 'axios'

let MESSAGE = ""

export const sendInitMessage=()=>{
    MESSAGE="new+NFT+is+being+added+to+cache"
    telegramAxios.get(MESSAGE)
}

export const sendUploadedMessage=(oldURI:string, newURI:string)=>{
    MESSAGE = `new+S3+object+was+added:+old+URI+(received+from+request):+${oldURI}.+new+URI+${newURI}`
    telegramAxios.get(MESSAGE)
}

export const sendNFTexistsMessage=(id:string)=>{
    MESSAGE = `an+NFT+with+same+data+already+exists,+with+id:+${id}`
    telegramAxios.get(MESSAGE)
}
    
export const sendNewNFTCachedMessage=(chainId:string,tokenId:string,contract:string,mediaURI:string,format:string)=>{
    MESSAGE = `new+NFT+added+to+cache:+chainId:+${chainId},+tokenId:+${tokenId},
    +contract+address:+${contract},+metadata:+image+URI:+${mediaURI},
    +format:+${format}.`
}
