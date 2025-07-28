'use client'

import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Checkbox, Divider, Form, Input } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import { useAuthStore } from '@/store/auth.store'
import { showError, showSuccess } from '@/store/notifications.store'
import {
  RegisterFormSchema,
  type RegisterFormData,
  transformRegisterToAPI,
} from '@/lib/validations/auth'

// Use the standardized schema from backend (includes password confirmation)
const registerSchema = RegisterFormSchema

export default function RegisterPage() {
  const router = useRouter()
  const {
    register: registerUser,
    isLoading,
    error,
    clearError,
  } = useAuthStore()
  const [form] = Form.useForm()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as any, // Type assertion needed due to branded types
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()

      // Transform frontend form data to backend API format
      const apiData = transformRegisterToAPI(data)

      // Register user with standardized data
      await registerUser(
        apiData.email,
        apiData.password,
        `${apiData.firstName} ${apiData.lastName}`
      )

      showSuccess(
        'Registration successful',
        'Please check your email to verify your account.'
      )

      // Redirect to login page (user needs to verify email first)
      router.push('/login')
    } catch (err: any) {
      showError('Registration failed', err.message || 'Please try again')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in here
          </Link>
        </p>
      </div>

      {error && (
        <Alert
          message="Registration Failed"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <Form.Item
          label="First Name"
          validateStatus={errors.firstName ? 'error' : ''}
          help={errors.firstName?.message}
        >
          <Input
            {...register('firstName')}
            prefix={<UserOutlined />}
            placeholder="Enter your first name"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Last Name"
          validateStatus={errors.lastName ? 'error' : ''}
          help={errors.lastName?.message}
        >
          <Input
            {...register('lastName')}
            prefix={<UserOutlined />}
            placeholder="Enter your last name"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Email address"
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Input
            {...register('email')}
            prefix={<MailOutlined />}
            placeholder="Enter your email"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message}
        >
          <Input.Password
            {...register('password')}
            prefix={<LockOutlined />}
            placeholder="Create a password"
            size="large"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          validateStatus={errors.confirmPassword ? 'error' : ''}
          help={errors.confirmPassword?.message}
        >
          <Input.Password
            {...register('confirmPassword')}
            prefix={<LockOutlined />}
            placeholder="Confirm your password"
            size="large"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          valuePropName="checked"
          validateStatus={errors.acceptTerms ? 'error' : ''}
          help={errors.acceptTerms?.message}
        >
          <Checkbox {...register('acceptTerms')}>
            I accept the{' '}
            <Link
              href="/terms"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Privacy Policy
            </Link>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            size="large"
            className="w-full"
          >
            Create Account
          </Button>
        </Form.Item>
      </Form>

      <div className="text-xs text-gray-500 text-center">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
          Privacy Policy
        </Link>
      </div>

      <Divider>
        <span className="text-gray-500">Already have an account?</span>
      </Divider>

      <div className="text-center">
        <Link href="/login">
          <Button size="large" className="w-full">
            Sign in to existing account
          </Button>
        </Link>
      </div>
    </div>
  )
}
