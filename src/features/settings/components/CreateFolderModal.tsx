"use client"

import React from 'react'
import {
    CreateCollectionModal,
    CreateCollectionModalProps
} from '@/shared/commonComponents/CreateCollectionModal'

export type CreateFolderModalProps = CreateCollectionModalProps

export function CreateFolderModal(props: CreateFolderModalProps) {
    return <CreateCollectionModal {...props} />
}
