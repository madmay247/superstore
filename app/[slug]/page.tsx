"use client";

import { use, useEffect, useState } from "react";
import { themeInk } from "../data";
import { fetchStore, type SavedStore } from "../store/persist";
import { Avatar, SocialRow, ProfileContext, StoreBlocks } from "../store/shared";

export default function PublicStore({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<SavedStore | null | undefined>(undefined);

  useEffect(() => {
    fetchStore(slug).then(setData);
  }, [slug]);

  if (data === undefined) {
    return (
      <div className="pub pub-missing" aria-busy="true">
        <span className="pub-spinner" aria-label="Loading store" />
      </div>
    );
  }
  if (!data) {
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
