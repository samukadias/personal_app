import type { ComponentType, ReactNode } from 'react'
import { IconBox, IconLink, IconLock, IconNote } from '../components/icons'
import Guardados from './guardados/Guardados'
import Sites from './sites/Sites'
import Cofre from './cofre/Cofre'
import Notas from './notas/Notas'

/**
 * Registro de módulos — para criar um módulo novo:
 *  1. crie src/modules/<nome>/<Nome>.tsx usando useCollection('<kind>')
 *  2. adicione uma entrada aqui. Pronto: aparece no menu, na Home e no backup.
 */
export type ModuleDef = {
  id: string            // vira a rota: #/<id>
  name: string
  tagline: string
  color: string         // cor-tema do módulo
  icon: ReactNode
  kind: string          // tipo de registro principal (pra contar na Home)
  component: ComponentType<{ params: string[] }>
}

export const modules: ModuleDef[] = [
  { id: 'cade', name: 'Cadê?', tagline: 'achar o que tá guardado', color: 'var(--mustard)', icon: <IconBox />, kind: 'coisa', component: Guardados },
  { id: 'sites', name: 'Sites', tagline: 'favoritos com gaveta', color: 'var(--sky)', icon: <IconLink />, kind: 'site', component: Sites },
  { id: 'cofre', name: 'Cofre', tagline: 'senhas trancadas a 7 chaves', color: 'var(--mint)', icon: <IconLock />, kind: 'cofre', component: Cofre },
  { id: 'notas', name: 'Notas', tagline: 'ideias antes que fujam', color: 'var(--pink)', icon: <IconNote />, kind: 'nota', component: Notas },
]
