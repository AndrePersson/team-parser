import React, { useEffect, useState } from 'react';

function App() {
  const [rawHtml, setRawHtml] = useState(() => sessionStorage.getItem('teamHtml') || '');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!rawHtml) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const listItems = doc.querySelectorAll('ul.teamsList > li');
    const parsedTeams = [];

    listItems.forEach(li => {
      const teamName = li.querySelector('h2 span')?.textContent.trim() || 'Unknown';
      const members = Array.from(li.querySelectorAll('.teamLogo')).map(img =>
        img.alt.replace(/'s logo'?$/, '').trim()
      );
      parsedTeams.push({ name: teamName, members });
    });

    setTeams(parsedTeams);
  }, [rawHtml]);

  const handleSave = () => {
    sessionStorage.setItem('teamHtml', rawHtml);
    window.location.reload(); // quick refresh to re-parse
  };

  const handleClear = () => {
    sessionStorage.removeItem('teamHtml');
    setRawHtml('');
    setTeams([]);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>MCC Team Parser</h1>

      {!rawHtml && (
        <>
          <p>Paste HTML below:</p>
          <textarea
            value={rawHtml}
            onChange={e => setRawHtml(e.target.value)}
            rows={15}
            style={{ width: '100%' }}
          />
          <button onClick={handleSave}>Save & Parse</button>
        </>
      )}

      {teams.length > 0 && (
        <>
          <h2>Parsed Teams</h2>
          <button onClick={handleClear}>Clear</button>
          {teams.map((team, i) => (
            <div key={i}>
              <h3>{team.name}</h3>
              <ul>
                {team.members.map((m, j) => (
                  <li key={j}>{m}</li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
