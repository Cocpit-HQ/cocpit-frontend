// 'use client';
// import React from 'react';
// import { useForm } from 'react-hook-form';
// import { z } from 'zod';
// import { zodResolver } from '@hookform/resolvers/zod';
// import styles from './SignUpForm.module.css';

// const schema = z.object({
//   name: z.string().min(1, 'Enter name'),
//   email: z.string().min(1,'Email required').email('Invalid email'),
//   password: z.string().min(6, 'Password must be at least 6'),
// });

// type SignUpFormInputs = z.infer<typeof schema>;

// export default function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
//   const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormInputs>({
//     resolver: zodResolver(schema),
//     defaultValues: { name:'', email:'', password:'' }
//   });

//   async function onSubmit(data: SignUpFormInputs) {
//     try {
//       // TODO: call your signup endpoint
//       alert('Signed up (mock): ' + data.email);
//       onSuccess?.();
//     } catch (err) {
//       alert('Sign up failed');
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
//       <div className={styles.formGroup}>
//         <label className={styles.label}>Full name</label>
//         <input {...register('name')} className={styles.input} placeholder="Your name" />
//         {errors.name && <p className={styles.errorText}>{errors.name.message}</p>}
//       </div>

//       <div className={styles.formGroup}>
//         <label className={styles.label}>Email</label>
//         <input {...register('email')} className={styles.input} placeholder="you@example.com" />
//         {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
//       </div>

//       <div className={styles.formGroupLarge}>
//         <label className={styles.label}>Password</label>
//         <input {...register('password')} type="password" className={styles.input} placeholder="Create a password" />
//         {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
//       </div>

//       <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
//         {isSubmitting ? 'Creating...' : 'Create account'}
//       </button>
//     </form>
//   );
// }
