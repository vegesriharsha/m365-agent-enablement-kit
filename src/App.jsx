import { useEffect, useState } from 'react';
import Layout from './components/Layout.jsx';
import config from './pathway.config.js';
import { pageById } from './content/registry.js';
import Home from './archetypes/Home.jsx';
import Journey from './archetypes/Journey.jsx';
import Glossary from './archetypes/Glossary.jsx';
import Explorer from './archetypes/Explorer.jsx';
import Sequencer from './archetypes/Sequencer.jsx';
import Decision from './archetypes/Decision.jsx';
import Flow from './archetypes/Flow.jsx';
import Practice from './archetypes/Practice.jsx';
import Register from './archetypes/Register.jsx';

// Archetype name in the registry -> component that renders it.
const archetypes = { home: Home, journey: Journey, glossary: Glossary, explorer: Explorer, sequencer: Sequencer, decision: Decision, flow: Flow, practice: Practice, register: Register };

const readHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '');
  return pageById[id] ? id : 'home';
};

export default function App() {
  const [id, setId] = useState(readHash);

  useEffect(() => {
    const onHash = () => {
      setId(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const page = pageById[id];
  useEffect(() => {
    document.title = id === 'home' ? config.siteName : `${page.title} · ${config.siteName}`;
  }, [id, page]);

  // A custom page brings its own component; everything else is an archetype filled with data.
  const Page = page.component ?? archetypes[page.archetype];
  return (
    <Layout current={id}>
      <Page page={page} data={page.data} />
    </Layout>
  );
}
