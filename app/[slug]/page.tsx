"use client";

import { use, useEffect, useState } from "react";
import { themeInk } from "../data";
import { fetchStore, type SavedStore } from "../store/persist";
import { Avatar, SocialRow, ProfileContext, StoreBlocks } from "../store/shared";

export default function PublicStore({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<SavedStore | "missing" | "error" | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setData(undefined);
    fetchStore(slug).then(setData);
  }, [slug, attempt]);

  if (data === undefined) {
    return (
      <div className="pub pub-missing" aria-busy="true">
        <span className="pub-spinner" aria-label="Loading store" />
      </div>
    );
  }
  if (data === "error") {
    return (
      <div className="pub pub-missing">
        <h1>This store didn’t load</h1>
        <p>Check your connection and try again.</p>
        <button type="button" className="pub-home" onClick={() => setAttempt((a) => a + 1)}>Try again</button>
      </div>
    );
  }
  if (data === "missing") {
    return (
      <div className="pub pub-missing">
        <h1>Store not found</h1>
        <p>There’s no store at /{slug}.</p>
        <a className="pub-home" href="/">Build your own store</a>
      </div>
    );
  }

  return (
    <ProfileContext.Provider value={data.profile}>
      <div className="pub" style={{ background: data.theme }}>
        <div className="pub-col">
          <div className="pp-top" style={themeInk(data.theme)}>
            <Avatar size={110} />
            <b>{data.profile.name}</b>
            <span className="pp-bio">{data.profile.bio}</span>
            <SocialRow size={26} />
          </div>
          <StoreBlocks theme={data.theme} blocks={data.blocks} />
        </div>
      </div>
    </ProfileContext.Provider>
  );
}
