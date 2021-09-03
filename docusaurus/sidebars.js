/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

module.exports = {
  tutorialSidebar: [
    // Can group some introductory docs into category
    // {
    //   type: "category",
    //   label: "Getting Started",
    //   items: ["index"],
    // },
    {
      type: "doc",
      id: "Introduction",
    },
    {
      type: "category",
      label: "API",
      items: [
        {
          type: "autogenerated",
          dirName: "api",
        },
      ]
    }
  ],
};
