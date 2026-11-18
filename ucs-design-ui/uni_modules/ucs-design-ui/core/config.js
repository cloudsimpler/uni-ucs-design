import { createConfigStore } from './store.js'

const store = createConfigStore()
export const initializeConfig = store.initializeConfig
export const updateConfig = store.updateConfig
export const resetConfig = store.resetConfig
export const getConfig = store.getConfig
export const getRequestConfig = store.getRequestConfig
export const useConfig = store.useConfig
export const getFontSize = store.getFontSize
export const getIconSize = store.getIconSize
export const getIconDefinition = store.getIconDefinition
export const useThemeColors = store.useThemeColors
export const useThemeColorCssVars = store.useThemeColorCssVars
export const getThemeColor = store.getThemeColor
export const getThemeMode = store.getThemeMode
export const setThemeMode = store.setThemeMode
export const setThemeColor = store.setThemeColor
export const updateThemeColors = store.updateThemeColors
export const getLanguage = store.getLanguage
export const setLanguage = store.setLanguage
export const getFallbackLanguage = store.getFallbackLanguage
export const setFallbackLanguage = store.setFallbackLanguage
export const getUcsDesignText = store.getUcsDesignText
export const getI18nText = store.getI18nText
