import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { Toggle } from './retroui/Toggle'

interface SidebarContainerProps {
    className?: string
    children: ReactNode
}

export function SidebarContainer({ className, children }: SidebarContainerProps) {
    return (
        <div className={cn("flex flex-col h-full", className)}>
            {children}
        </div>
    )
}

interface SidebarHeaderProps {
    children: ReactNode
    className?: string
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
    return (
        <div className={cn("mb-6", className)}>
            {children}
        </div>
    )
}

interface SidebarContentProps {
    children: ReactNode
    className?: string
}

export function SidebarContent({ children, className }: SidebarContentProps) {
    return (
        <div className={cn("flex-grow overflow-y-auto mb-4 flex flex-col no-scrollbar", className)}>
            {children}
        </div>
    )
}

interface SidebarGroupProps {
    children: ReactNode
    className?: string
}

export function SidebarGroup({ children, className }: SidebarGroupProps) {
    return (
        <div className={cn("flex flex-col items-stretch gap-1 mb-6 p-0", className)}>
            {children}
        </div>
    )
}

interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: LucideIcon
    active?: boolean
    children: ReactNode
    className?: string
}

export function SidebarItem({ icon: Icon, active, children, className, onClick, ...props }: SidebarItemProps) {
    return (
        <Toggle
            pressed={active}
            onPressedChange={() => onClick && onClick({} as any)}
            className={cn("w-full justify-start", className)}
            variant="outlined"
            {...props as any}
        >
            {Icon && <Icon className="w-4 h-4 mr-3 shrink-0" />}
            {children}
        </Toggle>
    )
}

interface SidebarFooterProps {
    children: ReactNode
    className?: string
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
    return (
        <div className={cn("mt-auto pt-6 border-t border-border", className)}>
            {children}
        </div>
    )
}

// Namespace export for usage as SidebarAPI.Root, SidebarAPI.Item, etc.
export const SidebarAPI = {
    Root: SidebarContainer,
    Header: SidebarHeader,
    Content: SidebarContent,
    Group: SidebarGroup,
    Item: SidebarItem,
    Footer: SidebarFooter,
    Switch: SidebarSwitch,
    Case: SidebarCase
}

import { Children, isValidElement, type ReactElement } from 'react'

interface SidebarSwitchProps {
    value: string
    children: ReactNode
}

export function SidebarSwitch({ value, children }: SidebarSwitchProps) {
    const validChildren = Children.toArray(children).filter(isValidElement) as ReactElement<any>[]
    const activeCase = validChildren.find((child) => child.props.value === value)

    return activeCase || null
}

interface SidebarCaseProps {
    value: string
    children: ReactNode
}

export function SidebarCase({ value, children }: SidebarCaseProps) {
    return <>{children}</>
}
