import { useState } from 'react';
import { Send } from 'lucide-react';
import { PageHeader, Section, Insight, Segmented, Toggle, Button, Pill, Sources, Callout } from '../components/ui.jsx';
import { useProgress, pointOnPolyline } from '../lib/hooks.js';
import { VERIFIED, src } from '../data/sources.js';

const P = {
  A: [800, 120],
  bus: [660, 120],
  busMid: [660, 250],
  hubEdge: [610, 250],
  router: [550, 250],
  fw: [470, 250],
  gw: [352, 250],
  onprem: [130, 250],
  B: [800, 250],
  internet: [470, 39],
  C: [782, 366],
};

const flows = [
  { id: 'a-net', label: 'Internal app → internet', from: 'Workload A', to: 'Internet' },
  { id: 'a-b', label: 'Internal app → another spoke', from: 'Workload A', to: 'Workload B' },
  { id: 'a-onprem', label: 'Internal app → on-premises', from: 'Workload A', to: 'On-premises' },
  { id: 'onprem-b', label: 'On-premises → internal app', from: 'On-premises', to: 'Workload B' },
  { id: 'net-c', label: 'Internet → public app', from: 'Internet', to: 'Workload C' },
];

const toA = [P.A, P.bus, P.busMid, P.hubEdge];
const FW = toA.length; // index of the firewall in routes that start at Workload A
const backOut = [[490, 266], [672, 266], [672, 250], P.B];

/** Decide the route and outcome for a flow under the current settings. */
function route(flow, topo, routing, fwAllow) {
  const hubName = topo === 'hub' ? 'hub' : 'virtual hub';
  const bx = topo === 'hub' ? 590 : P.router[0];
  const viaFw = (pts, fwIndex, okText) =>
    fwAllow
      ? { pts, status: 'ok', inspected: true, text: okText }
      : {
          pts: pts.slice(0, fwIndex + 1),
          status: 'blocked',
          inspected: true,
          text: 'Azure Firewall dropped it. The firewall denies traffic unless a rule allows it, so every new flow needs an explicit rule.',
        };

  switch (flow) {
    case 'a-net':
      if (routing)
        return viaFw(
          [...toA, P.fw, P.internet],
          FW,
          `The spoke's route sends 0.0.0.0/0 to the firewall in the ${hubName}. The firewall inspects it, applies its rules and sends it out from its own public IP.`,
        );
      return {
        pts: [P.A, [800, 39], P.internet],
        status: 'warn',
        inspected: false,
        text:
          topo === 'hub'
            ? 'Without a route to the firewall, traffic follows Azure’s system route for 0.0.0.0/0. New virtual networks have private subnets, so it leaves only through a NAT gateway or public IP (older subnets still get default outbound access). Either way the firewall never sees it, which is why ALZ puts a route table on every spoke.'
            : 'Without routing intent, internet-bound traffic doesn’t go through the secured hub’s firewall. Turn routing intent on so the hub inspects it.',
      };
    case 'a-b':
      if (routing)
        return viaFw(
          [...toA, P.fw, ...backOut],
          FW,
          `Spoke-to-spoke traffic goes through the firewall in the ${hubName}, so it's inspected and logged like any other flow.`,
        );
      if (topo === 'hub')
        return {
          pts: toA,
          status: 'blocked',
          inspected: false,
          text: 'No route. Peering isn’t transitive: A and B are both peered to the hub, but not to each other. A route table that points at the firewall is what joins them.',
        };
      return {
        pts: [...toA, P.router, [560, 266], ...backOut.slice(1)],
        status: 'warn',
        inspected: false,
        text: 'It arrives, but uninspected. A Virtual WAN hub routes between connected networks by default; only routing intent makes that traffic pass through the firewall.',
      };
    case 'a-onprem':
      if (routing)
        return viaFw(
          [...toA, P.fw, P.gw, P.onprem],
          FW,
          'The route table sends on-premises ranges to the firewall, then out through the gateway over VPN or ExpressRoute.',
        );
      return {
        pts: [...toA, [bx, 250], [bx, 300], [352, 300], P.gw, P.onprem],
        status: 'warn',
        inspected: false,
        text: 'It reaches on-premises, but straight through the gateway, skipping the firewall. The gateway route wins unless the spoke has a route to the firewall.',
      };
    case 'onprem-b':
      if (routing)
        return viaFw(
          [P.onprem, P.gw, P.fw, P.hubEdge, P.B],
          2,
          topo === 'hub'
            ? 'A route on the gateway subnet sends incoming traffic for spoke ranges to the firewall before it reaches the workload.'
            : 'Routing intent sends traffic arriving from on-premises through the firewall before it reaches the workload.',
        );
      return {
        pts: [P.onprem, P.gw, [352, 300], [bx, 300], [bx, 250], P.hubEdge, P.B],
        status: 'warn',
        inspected: false,
        text:
          topo === 'hub'
            ? 'It arrives, but without inspection: with no route on the gateway subnet, traffic from on-premises goes straight to the spoke.'
            : 'It arrives, but without inspection: without routing intent the virtual hub sends branch traffic straight to the spoke.',
      };
    default:
      return {
        pts: [P.internet, [885, 39], [885, 366], P.C],
        status: 'ok',
        inspected: true,
        text: 'Public apps live in the Online landing zone. Traffic enters through a web application firewall (Application Gateway or Front Door) in front of the app, not through the hub firewall.',
      };
  }
}

function Box({ x, y, w, h, title, sub, active }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="var(--surface)" stroke={active ? 'var(--navy)' : 'var(--rule)'} strokeWidth={active ? 2 : 1.25} />
      <text x={x + 12} y={y + 24} fontSize="14" fontWeight="600" fill="var(--ink)">
        {title}
      </text>
      {sub && (
        <text x={x + 12} y={y + 43} fontSize="12" fill="var(--subtle)">
          {sub}
        </text>
      )}
    </g>
  );
}

export default function NetworkFlow() {
  const [flow, setFlow] = useState('a-net');
  const [topo, setTopo] = useState('hub');
  const [routing, setRouting] = useState(true);
  const [fwAllow, setFwAllow] = useState(true);
  const [run, setRun] = useState(0);
  const r = route(flow, topo, routing, fwAllow);
  const t = useProgress(`${run}-${flow}-${topo}-${routing}-${fwAllow}`, 2200);
  const [px, py] = pointOnPolyline(r.pts, t);
  const color = r.status === 'ok' ? 'var(--navy)' : r.status === 'warn' ? 'var(--gold)' : 'var(--bad)';
  const ptsStr = r.pts.map((p) => p.join(',')).join(' ');
  const end = r.pts[r.pts.length - 1];
  const f = flows.find((x) => x.id === flow);
  const hub = topo === 'hub';
  const on = (name) => f.from === name || f.to === name;

  return (
    <article>
      <PageHeader
        eyebrow="Animated flow · Network traffic"
        title="Every flow goes past the firewall, if you route it there"
        deck="Send traffic between spokes, on-premises and the internet. Switch off the routing and watch peering, gateways and Azure's own routes take it around the firewall instead."
        meta={[
          { dt: 'Topology', dd: hub ? 'Hub-and-spoke' : 'Virtual WAN' },
          { dt: 'Flows', dd: String(flows.length) },
          { dt: 'Firewall', dd: 'Azure Firewall' },
          { dt: 'Last verified', dd: VERIFIED },
        ]}
      />

      <Section n={1} title="Send a packet" intro="Pick a flow and the settings, then watch the route. Gold means it arrived without inspection; red means it was stopped.">
        <div className="space-y-4">
          <div className="overflow-x-auto border border-rule bg-paper">
            <svg viewBox="0 0 920 420" className="block w-full min-w-[600px]" role="img" aria-label={`${f.label}: ${r.status}`}>
              <defs>
                <marker id="nf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" fill={color} />
                </marker>
              </defs>
              {/* hub background */}
              <rect x={290} y={150} width={320} height={190} fill="var(--callout)" stroke="var(--rule)" strokeWidth="1.25" />
              <text x={302} y={174} fontSize="14" fontWeight="600" fill="var(--ink)">
                {hub ? 'Hub network' : 'Virtual hub (Microsoft-managed)'}
              </text>
              <text x={302} y={328} fontSize="12" fill="var(--subtle)">
                {hub ? 'Connectivity subscription · Bastion · DNS' : 'Secured hub · router managed for you'}
              </text>

              {/* static links */}
              <g stroke="var(--rule)" strokeWidth="1.25" fill="none">
                <path d="M610 250 H660 M660 120 V366 M660 120 H710 M660 250 H710 M660 366 H710" />
                <path d="M230 250 H322" />
                <path d="M470 64 V230" />
              </g>
              <text x={654} y={108} textAnchor="end" fontSize="11" fill="var(--subtle)">
                {hub ? 'peering' : 'hub connections'}
              </text>
              <text x={238} y={240} fontSize="11" fill="var(--subtle)">
                VPN / ER
              </text>

              {/* route, drawn under the boxes so labels stay readable */}
              <polyline points={ptsStr} fill="none" stroke={color} strokeWidth="3" strokeOpacity="0.3" className="flowing" />
              <polyline points={ptsStr} fill="none" stroke={color} strokeWidth="1.25" markerEnd={r.status === 'blocked' ? undefined : 'url(#nf-arrow)'} />

              <Box x={380} y={14} w={180} h={50} title="Internet" active={on('Internet')} />
              <Box x={30} y={210} w={200} h={80} title="On-premises" sub="Data centre and offices" active={on('On-premises')} />
              <rect x={322} y={234} width={60} height={32} fill="var(--surface)" stroke="var(--rule)" />
              <text x={352} y={254} textAnchor="middle" fontSize="11.5" fill="var(--ink)">
                Gateway
              </text>
              <rect x={430} y={230} width={80} height={40} fill="var(--surface)" stroke={fwAllow ? 'var(--navy)' : 'var(--bad)'} strokeWidth="1.5" />
              <text x={470} y={255} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">
                Firewall
              </text>
              {!hub && (
                <>
                  <circle cx={P.router[0]} cy={P.router[1]} r={9} fill="var(--surface)" stroke="var(--subtle)" />
                  <text x={P.router[0]} y={P.router[1] - 16} textAnchor="middle" fontSize="11" fill="var(--subtle)">
                    router
                  </text>
                </>
              )}
              <Box x={710} y={84} w={180} h={72} title="Workload A" sub="Internal (Corp) spoke" active={on('Workload A')} />
              <Box x={710} y={214} w={180} h={72} title="Workload B" sub="Internal (Corp) spoke" active={on('Workload B')} />
              <Box x={710} y={330} w={145} h={72} title="Workload C" sub="Online spoke" active={on('Workload C')} />
              <rect x={862} y={344} width={46} height={44} fill="var(--surface)" stroke="var(--rule)" />
              <text x={885} y={364} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink)">
                WAF
              </text>
              <text x={885} y={378} textAnchor="middle" fontSize="9.5" fill="var(--subtle)">
                App GW
              </text>

              <circle cx={px} cy={py} r={7} fill={color} stroke="var(--paper)" strokeWidth="2" />
              {r.status === 'blocked' && t >= 1 && (
                <g transform={`translate(${end[0]} ${end[1]})`}>
                  <circle r={14} fill="var(--bad-soft)" stroke="var(--bad)" strokeWidth="1.5" />
                  <path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="var(--bad)" strokeWidth="2" />
                </g>
              )}
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[14px] font-medium text-ink">{f.label}</span>
            <Pill tone={r.status === 'ok' ? 'good' : r.status === 'warn' ? 'gold' : 'bad'}>
              {r.status === 'ok' ? 'Delivered' : r.status === 'warn' ? 'Delivered, not inspected' : 'Stopped'}
            </Pill>
            <Pill tone={r.inspected ? 'navy' : 'neutral'}>{r.inspected ? 'Inspected' : 'Not inspected'}</Pill>
          </div>
          <Insight stateKey={`${flow}-${topo}-${routing}-${fwAllow}`} tone={r.status === 'ok' ? 'navy' : r.status === 'warn' ? 'gold' : 'bad'}>
            <p>{r.text}</p>
          </Insight>

          <div className="grid gap-6 pt-2 md:grid-cols-2">
            <div>
              <p className="label mb-1.5">Flow</p>
              <div role="radiogroup" aria-label="Flow" className="flex flex-col border border-rule">
                {flows.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    role="radio"
                    aria-checked={x.id === flow}
                    onClick={() => setFlow(x.id)}
                    className={`border-b border-faint px-3 py-2 text-left text-[13.5px] last:border-b-0 ${x.id === flow ? 'bg-navy text-on-navy' : 'text-ink hover:bg-faint'}`}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <Segmented
                label="Topology"
                value={topo}
                onChange={setTopo}
                options={[
                  { value: 'hub', label: 'Hub-and-spoke' },
                  { value: 'vwan', label: 'Virtual WAN' },
                ]}
              />
              <Toggle
                label={hub ? 'Route tables send traffic to the firewall' : 'Routing intent on the virtual hub'}
                hint={hub ? 'User-defined routes on spokes and the gateway subnet' : 'Makes the secured hub inspect private and internet traffic'}
                checked={routing}
                onChange={setRouting}
              />
              <Segmented
                label="Firewall rule for this flow"
                value={fwAllow ? 'allow' : 'none'}
                onChange={(v) => setFwAllow(v === 'allow')}
                options={[
                  { value: 'allow', label: 'Allow rule' },
                  { value: 'none', label: 'No rule' },
                ]}
              />
              <Button onClick={() => setRun((n) => n + 1)}>
                <Send size={14} /> Send again
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section n={2} title="What to take away" wide={false}>
        <ul className="space-y-2.5 text-[15px] leading-[1.6]">
          {[
            'Peering connects two networks only. Spokes reach each other through the hub because a route sends them there.',
            'The firewall only sees traffic that is routed to it. Route tables (hub-and-spoke) or routing intent (Virtual WAN) are what put it in the path.',
            'Azure Firewall denies by default. Each flow your workloads need is an allow rule someone has to request, review and record.',
            'Inbound web traffic to public apps enters through a web application firewall in the Online landing zone.',
          ].map((x) => (
            <li key={x} className="flex gap-3">
              <span className="mt-[10px] h-[5px] w-[5px] shrink-0 bg-navy" />
              {x}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <Callout tone="gold" title="Simplified here">
            Real routing has more cases: forced tunnelling, private endpoint routes, firewall SNAT, network virtual appliances
            instead of Azure Firewall, and Virtual WAN's own route tables. The flows shown are the common defaults.
          </Callout>
        </div>
      </Section>

      <Sources verified={VERIFIED} items={[src.hubSpoke, src.vwan, src.firewallSku, src.scenarios]} />
    </article>
  );
}
