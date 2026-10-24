// account.ban
export type AccountBanParams = { owner_id: number }
export type AccountBanResponse = 1

// account.unban
export type AccountUnbanParams = { owner_id: number }
export type AccountUnbanResponse = 1

// account.setSilenceMode
export type AccountSetSilenceModeParams = {
  peer_id: number
  time?: number
  sound?: number
}

export type AccountSetSilenceModeResponse = 1
