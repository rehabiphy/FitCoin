import { useState } from 'react';
import { useSearchParams } from 'react-router';
import Reveal from '../components/Reveal.jsx';
import Icon, { IconBubble } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import { SITE } from '../site.js';

const TOPICS = ['Support', 'Missing reward', 'Redemption problem', 'Premium & billing', 'Partnership', 'Privacy request', 'Launch updates', 'Other'];

const emailFor = topic => (topic === 'Partnership' ? SITE.partnersEmail : topic === 'Privacy request' ? SITE.privacyEmail : SITE.supportEmail);

export default function Contact() {
  const [params] = useSearchParams();
  const initialTopic = TOPICS.includes(params.get('topic')) ? params.get('topic') : 'Support';
  const [form, setForm] = useState({ name: '', email: '', topic: initialTopic, message: params.get('message') || '' });
  const [sent, setSent] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // There's no contact API yet, so the form opens the visitor's email app with everything filled in.
  const submit = e => {
    e.preventDefault();
    const subject = `[${form.topic}] ${form.name}`;
    const body = `${form.message}\n\nName: ${form.name}\nAccount email: ${form.email}`;
    window.location.href = `mailto:${emailFor(form.topic)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const cards = [
    { icon: 'LifeBuoy', color: 'mint', t: 'Support', d: 'Help with steps, rewards, redemptions or your account.', email: SITE.supportEmail },
    { icon: 'Handshake', color: 'gold', t: 'Partnerships', d: 'Offer your rewards in the axyio marketplace.', email: SITE.partnersEmail },
    { icon: 'Lock', color: 'primary', t: 'Privacy', d: 'Data access, correction or deletion requests.', email: SITE.privacyEmail },
  ];

  return (
    <>
      <PageHero eyebrow="Contact" title="Let’s talk">
        <p>Questions, feedback or partnership ideas? We read every message and usually reply within 2 working days.</p>
      </PageHero>

      <section className="section pt-0">
        <div className="container contact">
          <div className="contact-cards">
            {cards.map((c, i) => (
              <Reveal key={c.t} className="card contact-card" variant="left" delay={i * 0.08}>
                <IconBubble name={c.icon} color={c.color} size={44} />
                <div>
                  <h3>{c.t}</h3>
                  <p>{c.d}</p>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </div>
              </Reveal>
            ))}
            <Reveal className="card contact-card" variant="left" delay={0.24}>
              <IconBubble name="Timer" color="cyan" size={44} />
              <div>
                <h3>Response time</h3>
                <p>We aim to answer every message within 2 working days.</p>
              </div>
            </Reveal>
          </div>

          <Reveal className="card form-card" variant="right">
            {sent ? (
              <div className="sent">
                <IconBubble name="Send" color="mint" size={56} />
                <h2 className="h3">Your email app should be open</h2>
                <p>
                  Hit send there and we’ll get back to you soon. If nothing opened, email us at{' '}
                  <a href={`mailto:${emailFor(form.topic)}`}>{emailFor(form.topic)}</a>.
                </p>
                <button className="btn btn-ghost btn-sm" onClick={() => setSent(false)}>
                  Back to the form
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="form">
                <h2 className="h3">Send us a message</h2>
                <div className="form-row">
                  <label>
                    <span>Your name</span>
                    <input required value={form.name} onChange={set('name')} autoComplete="name" maxLength={80} />
                  </label>
                  <label>
                    <span>Email</span>
                    <input required type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="The one you use in axyio" />
                  </label>
                </div>
                <label>
                  <span>Topic</span>
                  <select value={form.topic} onChange={set('topic')}>
                    {TOPICS.map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Message</span>
                  <textarea required rows={6} value={form.message} onChange={set('message')} maxLength={3000} placeholder="Tell us what happened. Include dates and screenshots where you can." />
                </label>
                <button className="btn btn-primary" type="submit">
                  <Icon name="Send" size={18} /> Send message
                </button>
                <p className="muted small">Sending opens your email app. We only use your details to reply to you.</p>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
