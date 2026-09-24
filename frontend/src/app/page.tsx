import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 text-gray-800">
      <div className="max-w-md w-full space-y-6 text-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Dhaka Tesla Pool</h1>
          <p className="mt-2 text-sm text-gray-600">
            Share a seat. Split the fare. Survive Dhaka traffic.
          </p>
        </div>

        <div className="grid gap-4 pt-4">
          <Link
            href="/passenger"
            className="w-full block py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition text-center"
          >
            Passenger App 
          </Link>
          <Link
            href="/driver"
            className="w-full block py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg shadow-sm transition text-center"
          >
            Driver App 
          </Link>
        </div>
      </div>
    </main>
  );
}