import React, { useState, useEffect } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc } from "./firebase"; // Import functions from firebase.js

function App() {
  const [rawHtml, setRawHtml] = useState(
    () => localStorage.getItem("teamHtml") || ""
  );
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem("parsedTeams");
    return saved ? JSON.parse(saved) : [];
  });
  const [parseError, setParseError] = useState("");
  const [isParsed, setIsParsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const hermitcraftList = [
    "GoodTimeWithScar",
    "Smallishbeans",
    "falsesymmetry",
    "Skizzleman",
    "Xisuma",
    "cubfan135",
  ];

  useEffect(() => {
    // Fejkladdning på 2 sekunder innan vi hämtar data
    const fakeLoading = setTimeout(() => {
      setLoading(true); // Startar med "laddning"

      // Simulerad fördröjning innan vi hämtar den faktiska datan
      setTimeout(async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "teams"));
          const firestoreTeams = querySnapshot.docs.map((doc) => doc.data());
          setTeams(firestoreTeams);
          setIsParsed(true);
        } catch (error) {
          console.error("Error fetching teams: ", error);
        } finally {
          setLoading(false); // Stänger av laddning
        }
      }, 500); // Fejkladdning i 2 sekunder
    }, 500); // Fördröjer innan vi börjar fejkladdning

    return () => clearTimeout(fakeLoading); // Städar upp timeouten om komponenten tas bort
  }, []);

  const handleSave = async () => {
    try {
      const parsedTeams = [];
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, "text/html");
      const listItems = doc.querySelectorAll("ul.teamsList > li");

      if (listItems.length === 0) {
        setParseError(
          'No <ul class="teamsList"> found. Please check your HTML input.'
        );
        setTeams([]);
        setIsParsed(false);
        return;
      }

      listItems.forEach((li) => {
        const teamName =
          li.querySelector("h2 span")?.textContent.trim() || "Unknown";
        const logoElement = li.querySelector("button.teamIconContainer img");
        const logoSrc = logoElement ? logoElement.getAttribute("src") : "";
        const logos = Array.from(li.querySelectorAll(".teamLogo"));

        const members = logos.map((img) => {
          const name = img.alt.replace(/'s logo'?$/, "").trim();
          const anchor = img.closest("a");
          let stream = null;
          let avatar = img.src;

          if (anchor) {
            const streamUrl = anchor.href;
            let type = "other";
            if (
              streamUrl.includes("youtube.com") ||
              streamUrl.includes("youtu.be")
            ) {
              type = "youtube";
            } else if (streamUrl.includes("twitch.tv")) {
              type = "twitch";
            }

            stream = { url: streamUrl, type };
          }

          return { name, stream, avatar };
        });

        parsedTeams.push({
          name: teamName,
          members,
          logo: logoSrc,
        });
      });

      const teamsCollectionRef = collection(db, "teams");

      const querySnapshot = await getDocs(teamsCollectionRef);
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });

      parsedTeams.forEach(async (team) => {
        await addDoc(teamsCollectionRef, {
          teamName: team.name,
          members: team.members,
          logo: team.logo,
        });
      });

      localStorage.setItem("teamHtml", rawHtml);
      localStorage.setItem("parsedTeams", JSON.stringify(parsedTeams));
      setTeams(parsedTeams);
      setParseError("");
      setIsParsed(true);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleClear = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear the parsed teams and HTML?"
    );
    if (!confirmClear) return;

    localStorage.removeItem("teamHtml");
    localStorage.removeItem("parsedTeams");
    setRawHtml("");
    setTeams([]);
    setParseError("");
    setIsParsed(false);
  };

  return (
    <>
      {loading && <div className="loader"></div>}
      {!loading && (
        <>
          {!isParsed && (
            <>
              <p className="mb-2">Paste HTML below:</p>
              <div className="mb-3">
                <textarea
                  className="form-control"
                  value={rawHtml}
                  onChange={(e) => setRawHtml(e.target.value)}
                  rows={10}
                />
              </div>
              <button className="btn btn-success me-2" onClick={handleSave}>
                Save & Parse
              </button>
            </>
          )}
          {parseError && (
            <div className="alert alert-danger mt-4" role="alert">
              {parseError}
            </div>
          )}

          {teams.length > 0 && isParsed && (
            <>
              <div className="accordion" id="teamsAccordion">
                {teams.map((team, i) => (
                  <div className="accordion-item" key={i}>
                    <h2 className="accordion-header" id={`heading-${i}`}>
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse-${i}`}
                        aria-expanded="false"
                        aria-controls={`collapse-${i}`}
                      >
                        {team.logo && (
                          <img
                            src={team.logo}
                            alt={`${team.teamName} logo`}
                            className="me-2"
                            style={{ height: "30px" }}
                          />
                        )}
                        {team.teamName}
                        {team.members.some((m) =>
                          hermitcraftList.includes(m.name)
                        ) && <span className="text-warning ms-1">*</span>}
                      </button>
                    </h2>
                    <div
                      id={`collapse-${i}`}
                      className="accordion-collapse collapse bg-dark"
                      aria-labelledby={`heading-${i}`}
                    >
                      <div className="accordion-body">
                        <ul className="list-group">
                          {team.members.map((member, j) => {
                            const isHermit = hermitcraftList.includes(
                              member.name
                            );
                            return (
                              <li
                                className={`list-group-item list-group-item-dark ${
                                  isHermit ? "hermit-member" : ""
                                }`}
                                key={j}
                              >
                                {member.name}
                                {member.stream && (
                                  <span className="ms-2 small text-info">
                                    [
                                    <a
                                      href={member.stream.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {member.stream.type}
                                    </a>
                                    ]
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <footer className="text-center mt-3">
            {isParsed && (
              <button className="btn btn-sm btn-dark" onClick={handleClear}>
                Clear
              </button>
            )}
          </footer>
        </>
      )}
    </>
  );
}

export default App;
