import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-zinc-900">
      <header className="flex w-full items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 font-bold text-xl text-green-700">
          <span>🌿</span> Greenery
        </div>
        <div className="flex gap-4">
          <a href="/login" className="px-4 py-2 font-medium hover:text-green-600">Login</a>
          <a href="/login?tab=signup" className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition">Get Started</a>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">

          <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
            <h1 className="text-6xl font-bold text-center dark:text-white">Greenery</h1>
          </div>

          <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
            <a
              href="/dashboard/marketplace"
              className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/30"
            >
              <h2 className={`mb-3 text-2xl font-semibold dark:text-white`}>
                Marketplace{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  -&gt;
                </span>
              </h2>
              <p className={`m-0 max-w-[30ch] text-sm opacity-50 dark:text-gray-300`}>
                Buy and sell plants locally.
              </p>
            </a>

            <a
              href="/dashboard"
              className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/30"
            >
              <h2 className={`mb-3 text-2xl font-semibold dark:text-white`}>
                Map{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  -&gt;
                </span>
              </h2>
              <p className={`m-0 max-w-[30ch] text-sm opacity-50 dark:text-gray-300`}>
                Find green spots near you.
              </p>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
