export default {
  async scheduled(event, env) {
    const resp = await fetch(
      "https://api.github.com/repos/MateuszICEA-a11y/zaplecze/actions/workflows/fb-poster.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_PAT}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "cf-fb-trigger",
        },
        body: JSON.stringify({ ref: "main" }),
      }
    );

    if (resp.ok || resp.status === 204) {
      console.log("Workflow dispatched successfully");
    } else {
      const body = await resp.text();
      console.error(`Failed: ${resp.status} ${body}`);
    }
  },
};
