import {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger
} from "./chunk-H5L36SDB.js";
import {
  MatOptgroup,
  MatOption
} from "./chunk-Q3BYUKAD.js";
import "./chunk-CB4CLAVG.js";
import "./chunk-J7IPBGEO.js";
import "./chunk-YPUCDDMB.js";
import "./chunk-AEFPNOYJ.js";
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatPrefix,
  MatSuffix
} from "./chunk-CLEZVN4D.js";
import "./chunk-PEGSON24.js";
import "./chunk-SIRWJQI5.js";
import "./chunk-TFBP75S3.js";
import "./chunk-OYBPVEYI.js";
import "./chunk-6V5HGMAI.js";
import "./chunk-MN76QQDR.js";
import "./chunk-J5MVGVUC.js";
import "./chunk-5NAMN5FD.js";
import "./chunk-LMUVQTNY.js";
import "./chunk-KJF6CXMO.js";
import "./chunk-OMV343B2.js";
import "./chunk-42FJBLFI.js";
import "./chunk-GV5LUSDY.js";
import "./chunk-5U4WN3IO.js";
import "./chunk-F5WPHNLD.js";
import "./chunk-2QZN6ODY.js";
import "./chunk-DG6N4IH3.js";
import "./chunk-XAF63IIR.js";
import "./chunk-JTOVIY3S.js";
import "./chunk-SXWSSH7E.js";
import "./chunk-PFNWKZMZ.js";
import "./chunk-2G4ZMV63.js";
import "./chunk-NZCSMDY7.js";
import "./chunk-4S5NALFP.js";
import "./chunk-XEYAOQKM.js";
import "./chunk-NT5JVIFL.js";
import "./chunk-E57VFWKJ.js";
import "./chunk-FUKUZFP3.js";
import "./chunk-BEKK4LPA.js";
import "./chunk-NUMT5ELH.js";
import "./chunk-TXDUYLVM.js";

// node_modules/@angular/material/fesm2022/select.mjs
var matSelectAnimations = {
  // Represents
  // trigger('transformPanelWrap', [
  //   transition('* => void', query('@transformPanel', [animateChild()], {optional: true})),
  // ])
  /**
   * This animation ensures the select's overlay panel animation (transformPanel) is called when
   * closing the select.
   * This is needed due to https://github.com/angular/angular/issues/23302
   */
  transformPanelWrap: {
    type: 7,
    name: "transformPanelWrap",
    definitions: [{
      type: 1,
      expr: "* => void",
      animation: {
        type: 11,
        selector: "@transformPanel",
        animation: [{
          type: 9,
          options: null
        }],
        options: {
          optional: true
        }
      },
      options: null
    }],
    options: {}
  },
  // Represents
  // trigger('transformPanel', [
  //   state(
  //     'void',
  //     style({
  //       opacity: 0,
  //       transform: 'scale(1, 0.8)',
  //     }),
  //   ),
  //   transition(
  //     'void => showing',
  //     animate(
  //       '120ms cubic-bezier(0, 0, 0.2, 1)',
  //       style({
  //         opacity: 1,
  //         transform: 'scale(1, 1)',
  //       }),
  //     ),
  //   ),
  //   transition('* => void', animate('100ms linear', style({opacity: 0}))),
  // ])
  /** This animation transforms the select's overlay panel on and off the page. */
  transformPanel: {
    type: 7,
    name: "transformPanel",
    definitions: [{
      type: 0,
      name: "void",
      styles: {
        type: 6,
        styles: {
          opacity: 0,
          transform: "scale(1, 0.8)"
        },
        offset: null
      }
    }, {
      type: 1,
      expr: "void => showing",
      animation: {
        type: 4,
        styles: {
          type: 6,
          styles: {
            opacity: 1,
            transform: "scale(1, 1)"
          },
          offset: null
        },
        timings: "120ms cubic-bezier(0, 0, 0.2, 1)"
      },
      options: null
    }, {
      type: 1,
      expr: "* => void",
      animation: {
        type: 4,
        styles: {
          type: 6,
          styles: {
            opacity: 0
          },
          offset: null
        },
        timings: "100ms linear"
      },
      options: null
    }],
    options: {}
  }
};
export {
  MAT_SELECT_CONFIG,
  MAT_SELECT_SCROLL_STRATEGY,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER,
  MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
  MAT_SELECT_TRIGGER,
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  MatOptgroup,
  MatOption,
  MatPrefix,
  MatSelect,
  MatSelectChange,
  MatSelectModule,
  MatSelectTrigger,
  MatSuffix,
  matSelectAnimations
};
//# sourceMappingURL=@angular_material_select.js.map
