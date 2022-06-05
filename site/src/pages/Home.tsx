import { useState } from "react";

type HomeProps = {
  darkMode: boolean | undefined;
  setDarkMode: (darkMode: boolean) => void;
};

function Home(props: HomeProps) {
  const { darkMode, setDarkMode } = props;
  const [name, setName] = useState<string>("");
  const recents: RecentType[] = JSON.parse(
    localStorage.getItem("recent") || "[]"
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 p-8 sm:p-12 dark:bg-gray-800 dark:text-white">
      <div className="w-full max-w-4xl rounded-md border-2 border-gray-100 bg-white p-10 pb-8 dark:bg-gray-700 dark:border-gray-500">
        <div className="relative w-full h-full">
          {(darkMode === true || darkMode === false) && (
            <button
              onClick={() => {
                setDarkMode(!darkMode);
                localStorage.setItem("theme", darkMode ? "light" : "dark");
              }}
              id="theme-toggle"
              type="button"
              className="absolute text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg p-2.5"
            >
              <svg
                id="theme-toggle-dark-icon"
                className={`w-5 h-5 ${darkMode ? "hidden" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
              <svg
                id="theme-toggle-light-icon"
                className={`w-5 h-5 ${darkMode ? "" : "hidden"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col items-center">
          <h3 className="mt-2 max-w-2xl text-center text-2xl font-bold leading-tight sm:text-3xl md:text-4xl md:leading-tight">
            Create a new checklist!
          </h3>
          <p className="mt-2 text-lg text-center">
            Real-time colaborative checklist app. This can be used for all sorts
            of things, like todos and shopping lists! It's easy to use, and it's
            free. No sign up needed! Built on Cloudflare Workers, Pages, DO and
            KV.
          </p>
          <form
            className="mx-auto mt-4 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:gap-0"
            onSubmit={(e) => {
              e.preventDefault();
              let usingName = name.trim();
              if (usingName.length < 3 || usingName.length > 25) {
                usingName = "";
              }
              fetch(`${process.env.REACT_APP_API_URL}/new`, {
                method: "POST",
                body: JSON.stringify({
                  name: usingName || "List",
                }),
              })
                .then((res) => res.json())
                .then((res) => {
                  window.location.href = `/${res.id}`;
                });
            }}
          >
            <input
              type="text"
              maxLength={25}
              onChange={(c) => setName(c.target.value)}
              className="dark:border-gray-800 dark:bg-gray-700 dark:focus:border-emerald-700 grow rounded border-2 border-gray-300 py-3 px-3 focus:border-emerald-700 focus:outline-none sm:rounded-l-md sm:rounded-r-none sm:border-r-0"
              placeholder="Name (optional)"
            />
            <button
              type="submit"
              className="rounded text-lg bg-emerald-700 px-5 py-4 font-bold text-white sm:rounded-l-none sm:rounded-r-md"
            >
              Create
            </button>
          </form>
        </div>

        <div className="mt-3">
          <div className="border rounded-md cursor-pointer p-2 w-full dark:border-gray-500">
            <table className="w-full">
              <tbody>
                {recents.length > 0 ? (
                  recents.map((r, idx) => (
                    <tr
                      className={`text-lg ${
                        idx === recents.length - 1 ? "" : "border-b"
                      }`}
                      aria-label="Recent lists"
                      onClick={() => {
                        window.location.href = `/${r.id}`;
                      }}
                      key={r.id}
                    >
                      <td className="w-auto">{r.name}</td>
                      <td className="md:text-base text-sm pr-3 ml-auto text-right">
                        {new Date(r.date).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-xl">No recent items</tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <footer className="absolute bottom-0 p-3 text-sm flex justify-center items-center dark:text-white">
        <p className="p-2">
          Created by{" "}
          <a
            className="underline"
            href="https://github.com/zegevlier"
            target="_blank"
            rel="noreferrer"
          >
            zegevlier
          </a>{" "}
          for the{" "}
          <a
            className="underline"
            href="https://challenge.developers.cloudflare.com/"
            target="_blank"
            rel="noreferrer"
          >
            Cloudflare Developer Challenge
          </a>{" "}
        </p>

        <button
          onClick={() => {
            window.open("https://github.com/zegevlier/todo");
          }}
          aria-label="View source on GitHub"
        >
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 256 250"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid"
          >
            <g>
              <path
                d="M128.00106,0 C57.3172926,0 0,57.3066942 0,128.00106 C0,184.555281 36.6761997,232.535542 87.534937,249.460899 C93.9320223,250.645779 96.280588,246.684165 96.280588,243.303333 C96.280588,240.251045 96.1618878,230.167899 96.106777,219.472176 C60.4967585,227.215235 52.9826207,204.369712 52.9826207,204.369712 C47.1599584,189.574598 38.770408,185.640538 38.770408,185.640538 C27.1568785,177.696113 39.6458206,177.859325 39.6458206,177.859325 C52.4993419,178.762293 59.267365,191.04987 59.267365,191.04987 C70.6837675,210.618423 89.2115753,204.961093 96.5158685,201.690482 C97.6647155,193.417512 100.981959,187.77078 104.642583,184.574357 C76.211799,181.33766 46.324819,170.362144 46.324819,121.315702 C46.324819,107.340889 51.3250588,95.9223682 59.5132437,86.9583937 C58.1842268,83.7344152 53.8029229,70.715562 60.7532354,53.0843636 C60.7532354,53.0843636 71.5019501,49.6441813 95.9626412,66.2049595 C106.172967,63.368876 117.123047,61.9465949 128.00106,61.8978432 C138.879073,61.9465949 149.837632,63.368876 160.067033,66.2049595 C184.49805,49.6441813 195.231926,53.0843636 195.231926,53.0843636 C202.199197,70.715562 197.815773,83.7344152 196.486756,86.9583937 C204.694018,95.9223682 209.660343,107.340889 209.660343,121.315702 C209.660343,170.478725 179.716133,181.303747 151.213281,184.472614 C155.80443,188.444828 159.895342,196.234518 159.895342,208.176593 C159.895342,225.303317 159.746968,239.087361 159.746968,243.303333 C159.746968,246.709601 162.05102,250.70089 168.53925,249.443941 C219.370432,232.499507 256,184.536204 256,128.00106 C256,57.3066942 198.691187,0 128.00106,0 Z M47.9405593,182.340212 C47.6586465,182.976105 46.6581745,183.166873 45.7467277,182.730227 C44.8183235,182.312656 44.2968914,181.445722 44.5978808,180.80771 C44.8734344,180.152739 45.876026,179.97045 46.8023103,180.409216 C47.7328342,180.826786 48.2627451,181.702199 47.9405593,182.340212 Z M54.2367892,187.958254 C53.6263318,188.524199 52.4329723,188.261363 51.6232682,187.366874 C50.7860088,186.474504 50.6291553,185.281144 51.2480912,184.70672 C51.8776254,184.140775 53.0349512,184.405731 53.8743302,185.298101 C54.7115892,186.201069 54.8748019,187.38595 54.2367892,187.958254 Z M58.5562413,195.146347 C57.7719732,195.691096 56.4895886,195.180261 55.6968417,194.042013 C54.9125733,192.903764 54.9125733,191.538713 55.713799,190.991845 C56.5086651,190.444977 57.7719732,190.936735 58.5753181,192.066505 C59.3574669,193.22383 59.3574669,194.58888 58.5562413,195.146347 Z M65.8613592,203.471174 C65.1597571,204.244846 63.6654083,204.03712 62.5716717,202.981538 C61.4524999,201.94927 61.1409122,200.484596 61.8446341,199.710926 C62.5547146,198.935137 64.0575422,199.15346 65.1597571,200.200564 C66.2704506,201.230712 66.6095936,202.705984 65.8613592,203.471174 Z M75.3025151,206.281542 C74.9930474,207.284134 73.553809,207.739857 72.1039724,207.313809 C70.6562556,206.875043 69.7087748,205.700761 70.0012857,204.687571 C70.302275,203.678621 71.7478721,203.20382 73.2083069,203.659543 C74.6539041,204.09619 75.6035048,205.261994 75.3025151,206.281542 Z M86.046947,207.473627 C86.0829806,208.529209 84.8535871,209.404622 83.3316829,209.4237 C81.8013,209.457614 80.563428,208.603398 80.5464708,207.564772 C80.5464708,206.498591 81.7483088,205.631657 83.2786917,205.606221 C84.8005962,205.576546 86.046947,206.424403 86.046947,207.473627 Z M96.6021471,207.069023 C96.7844366,208.099171 95.7267341,209.156872 94.215428,209.438785 C92.7295577,209.710099 91.3539086,209.074206 91.1652603,208.052538 C90.9808515,206.996955 92.0576306,205.939253 93.5413813,205.66582 C95.054807,205.402984 96.4092596,206.021919 96.6021471,207.069023 Z"
                fill="#161614"
              />
            </g>
          </svg>
        </button>
      </footer>
    </div>
  );
}

export default Home;
