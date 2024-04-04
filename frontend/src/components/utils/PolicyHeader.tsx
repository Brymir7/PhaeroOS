
function PolicyHeader() {
  return (
    <div>
      <nav className=" z-40 w-screen mt-8">
        <div className="flex w-full p-2 justify-between">
          <div className="flex items-center min-w-fit px-4 space-x-2 mr-auto md:mr-0">
            <p className={`logo h-14 w-14`}></p>

            <h1 className="text-3xl font-bold font-spectral">Phaero</h1>
          </div>
          <div className="xsm:flex min-w-fit items-center gap-6 hidden sm:mr-24 ml-auto">
            <a
              className="bg-gray-200 hover:bg-gray-300 border-2 border-green-600  rounded-md px-10 py-2 text-lg hover:shadow-xl "
              href="/signup"
              draggable="false"
            >
              Sign up
            </a>
            <a
              className="bg-green-500 hover:bg-green-600 rounded-md px-10 py-2 text-lg hover:shadow-xl "
              href="/login"
              draggable="false"
            >
              Log in
            </a>
          </div>
        </div>
      </nav>
      <div className="flex border-b mx-12 border-gray-400 mt-8 mb-20"></div>
    </div>
  );
}

export default PolicyHeader