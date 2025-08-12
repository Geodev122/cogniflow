import React from 'react'

export const ContactSupport: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Support</h2>
      <p className="text-gray-600 mb-4">
        Need help? Send us a message and our support team will get back to you.
      </p>
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            placeholder="How can we help?"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Send Message
        </button>
      </form>
      <div className="mt-6 text-sm text-gray-600">
        <p>
          Or reach us directly at{' '}
          <a href="mailto:support@cogniflow.com" className="text-blue-600 hover:underline">
            support@cogniflow.com
          </a>
          .
        </p>
      </div>
    </div>
  )
}

