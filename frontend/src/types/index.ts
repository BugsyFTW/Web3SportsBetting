/**
 * Data & Data types from:
 * https://api.football-data.org
 * 
 */

export interface FootballData {
  filters: Filters
  resultSet: ResultSet
  competition: Competition
  matches: Match[]
}

export interface Filters {
  season: string
  matchday: string
}

export interface ResultSet {
  count: number
  first: string
  last: string
  played: number
}

export interface Competition {
  id: number
  name: string
  code: string
  type: string
  emblem: string
}

export interface Match {
  area: Area
  competition: Competition
  season: Season
  id: number
  utcDate: Date
  status: string
  matchday: number
  stage: string
  group: string
  lastUpdated: string
  homeTeam: Team
  awayTeam: Team
  score: Score
  odds: Odds
  referees: any[]
}

export interface Area {
  id: number
  name: string
  code: string
  flag: string
}
export interface Season {
  id: number
  startDate: string
  endDate: string
  currentMatchday: number
  winner: any
}

export interface Team {
  id: number
  name: string
  shortName: string
  tla: string
  crest: string
}

export interface Score {
  winner: any
  duration: string
  fullTime: TimeScore
  halfTime: TimeScore
}

export interface TimeScore {
  home: any
  away: any
}

export interface Odds {
  msg: string
}
