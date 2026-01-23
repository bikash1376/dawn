'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Type-safe approach for getting form data
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    // If Supabase returns "Invalid API key", this error message will bubble up here
    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: `${origin}/auth/callback`
        }
    })

    if (error) {
        return { error: error.message }
    }

    // Do not revalidate or redirect yet, let modal handle the "Check Email" state
    return { success: true }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
    redirect('/')
}

export async function deleteConversation(conversationId: string) {
    const supabase = await createClient()

    // RLS policies ensure user can only delete their own conversations
    const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
}
