import React, { useState } from "react";

import PlayerProfileProps from "./PlayerProfileProps";
import * as styles from "./PlayerProfile.module.css";

import iconDefaultProfileImage from "@assets/img/defaultprofileimage.png";

interface PlayerProfileProps {
    profile: {
        username?: string;
        rating?: number;
        title?: string;
        image?: string;
    };
    captured?: { type: string, value: number, symbol: string }[];
    advantage?: string;
}

function PlayerProfile({ profile, captured, advantage }: PlayerProfileProps) {
    const [ defaultImage, setDefaultImage ] = useState(false);

    return <div className={styles.wrapper}>
        {profile.image && <img 
            className={styles.profileImage} 
            src={defaultImage
                ? iconDefaultProfileImage
                : profile.image
            }
            onError={() => setDefaultImage(true)}
        />}

        {profile.title && <span className={styles.title}>
            {profile.title}
        </span>}

        <span className={styles.username}>
            {profile.username || "?"}
        </span>

        {profile.rating != undefined
            && <span className={styles.rating}>
                ({profile.rating})
            </span>
        }

        {captured && captured.length > 0 && (
            <span className={styles.capturedContainer}>
                {captured.map((p, idx) => (
                    <span key={idx} className={styles.capturedPiece} title={p.type}>
                        {p.symbol}
                    </span>
                ))}
            </span>
        )}

        {advantage && (
            <span className={styles.advantageText}>
                {advantage}
            </span>
        )}
    </div>;
}

export default PlayerProfile;