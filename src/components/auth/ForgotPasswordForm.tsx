'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './ForgotPasswordForm.module.css';

const schema = z.object({ email: z.string().min(1,'Email required').email('Invalid email') });

type ForgotPasswordFormInputs = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormInputs>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  });

  async function onSubmit(data: ForgotPasswordFormInputs) {
    try {
      // stub - call API to send reset email
      alert('Password reset link sent to ' + data.email);
    } catch (err) {
      alert('Failed to send reset link');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Email</label>
        <input {...register('email')} className={styles.input} placeholder="you@example.com" />
        {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  );
}
