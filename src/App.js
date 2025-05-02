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

  const hermitcraftList = [
    "GoodTimeWithScar",
    "Smallishbeans",
    "falsesymmetry",
    "Skizzleman",
    "Xisuma",
    "cubfan135",
  ];

  // Fetch teams from Firestore on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Fetch data from the "teams" collection
        const querySnapshot = await getDocs(collection(db, "teams"));
        const firestoreTeams = querySnapshot.docs.map((doc) => doc.data());
        setTeams(firestoreTeams);
        setIsParsed(true); // Assuming you want to mark it as parsed when the data is fetched
      } catch (error) {
        console.error("Error fetching teams: ", error);
      }
    };

    fetchTeams();
  }, []);

  // Handle Save - Parse HTML and store in Firestore and Local Storage
  const handleSave = async () => {
    try {
      // Step 1: Parse the raw HTML
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
        const members = logos.map((img) =>
          img.alt.replace(/'s logo'?$/, "").trim()
        );

        parsedTeams.push({ name: teamName, members, logo: logoSrc });
      });

      // Step 2: Save the parsed teams to Firestore
      const teamsCollectionRef = collection(db, "teams");

      // Optional: Clear previous data in Firestore
      const querySnapshot = await getDocs(teamsCollectionRef);
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref); // Delete old documents if needed
      });

      // Add parsed teams to Firestore
      parsedTeams.forEach(async (team) => {
        await addDoc(teamsCollectionRef, {
          teamName: team.name,
          members: team.members,
          logo: team.logo,
        });
      });

      // Step 3: Update Local Storage and Component State
      localStorage.setItem("teamHtml", rawHtml);
      localStorage.setItem("parsedTeams", JSON.stringify(parsedTeams));
      setTeams(parsedTeams);
      setParseError("");
      setIsParsed(true); // Mark as successfully parsed
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // Handle Clear - Reset everything
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
    <div className="container py-4">
      <h1 className="mb-4 text-primary">MCC Team Parser</h1>
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
          <div className="row">
            {teams.map((team, i) => (
              <div className="col-6 col-sm-6 col-md-4 col-lg-3 mb-4" key={i}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt={`${team.name} logo`}
                          className="img-fluid mb-2"
                        />
                      )}
                      {team.teamName}
                    </h5>
                    <ul className="list-group">
                      {team.members.map((m, j) => {
                        const isHermit = hermitcraftList.includes(m);

                        return (
                          <li
                            className={`list-group-item ${
                              isHermit ? "hermit-member" : ""
                            }`}
                            key={j}
                          >
                            {m}
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
      <footer className="text-center mt-5">
        {isParsed && (
          <button className="btn btn-sm btn-dark" onClick={handleClear}>
            Clear
          </button>
        )}
      </footer>
    </div>
  );
}

export default App;
