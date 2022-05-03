import $ from 'jquery';

export default class Console {
  stay_timeout?: number;
  mouse_stay?: boolean;
  history_expanded?: boolean;
  dom: JQuery;
  history: JQuery;

  show(stay?: boolean) {
    this.dom.css({
      bottom: '6px',
      opacity: '1'
    });
    if (typeof this.stay_timeout != 'undefined')
      window.clearTimeout(this.stay_timeout);
    if (stay === true) this.mouse_stay = true;
    else if (stay === false) this.mouse_stay = false;
    if (!this.mouse_stay && !this.history_expanded)
      this.stay_timeout = window.setTimeout(
        (target: any) => {
          target.hide();
        },
        2500,
        this
      );
  }

  hide() {
    this.collapse();
    this.dom.css({
      bottom: '-70px',
      opacity: '0'
    });
    this.setColor();
  }

  expand() {
    if (this.history_expanded) {
      this.collapse();
      return;
    }
    this.history.css('display', 'flex');
    this.history[0].scrollTop = this.history[0].scrollHeight;
    this.history_expanded = true;
    this.setColor('rgba(0, 0, 0, .5)');
  }

  collapse() {
    this.history.css('display', 'none');
    this.history_expanded = false;
    this.setColor();
  }

  setColor(color?: string) {
    let shadow_width = '6px';
    if (!color) {
      color = 'rgba(0, 0, 0, .2)';
      shadow_width = '3px';
    }
    if (this.history_expanded) {
      shadow_width = '6px';
    }
    this.dom.css('filter', `drop-shadow(0px 0px ${shadow_width} ${color}`);
  }

  // type: error warning info done code
  log(text: string, channel?: string, type = 'info') {
    if (channel) {
      channel = `data-channel="${channel}"`;
      this.dom.find(`[${channel}]`).remove();
    }
    const html = `
      <div class="pjw-console-item" ${channel ? channel : ''}>
        <div class="pjw-console-icon material-icons-round ${type}">${type}</div>
        <div class="pjw-console-text">${text}</div>
      </div>
    `;

    this.dom.children('.pjw-console-item').appendTo(this.history);
    this.dom.append(html);
    if (this.history_expanded)
      this.history[0].scrollTop = this.history[0].scrollHeight;

    const action = {
      error: [true, '#b4220a'],
      warning: [true, '#b74710'],
      done: [true, 'limegreen'],
      favorite: [false, 'rgb(255, 99, 144)'],
      info: [false],
      alarm: [true, '#9eb314'],
      code: [false],
      death: [true, 'rgb(255, 99, 144)']
    } as any;

    this.setColor(action[type][1]);
    if (type == 'code') return;
    this.show(action[type][0]);
  }

  error(text: string, channel?: string) {
    this.log(text, channel, 'error');
  }

  success(text: string, channel?: string) {
    this.log(text, channel, 'done');
  }

  warn(text: string, channel?: string) {
    this.log(text, channel, 'warning');
  }

  debug(text: string, channel?: string) {
    this.log(text, channel, 'code');
  }

  info(text: string, channel?: string) {
    this.log(text, channel, 'info');
  }

  alert(text: string, channel?: string) {
    this.log(text, channel, 'alarm');
  }

  love(text: string, channel?: string) {
    this.log(text, channel, 'favorite');
  }

  recycling(text: string, channel?: string) {
    this.log(text, channel, 'death');
  }

  constructor() {
    const html = `
    <div id="pjw-console">
      <div id="pjw-console-history">
        <div class="pjw-mini-brand"><span class="material-icons-round" style="font-size: 14px; color: rgba(0, 0, 0, .5);">assignment</span><p style="font-size: 10px;">Artio.io Floating Panel</p></div>
      </div>
      <div class="pjw-console-item">
        <div class="pjw-console-icon material-icons-round">sports_esports</div>
        <div class="pjw-console-text">Artio.io</div>
      </div>
    </div>`;

    this.dom = $(html).appendTo('body');
    this.history = this.dom.children('#pjw-console-history');

    $(document).on(
      'mousemove',
      null,
      {
        target: this
      },
      function (e) {
        if (window && e.clientY >= ($(window).height() ?? 40) - 40)
          e.data.target.show();
      }
    );

    $(document).on(
      'mousedown',
      null,
      {
        target: this
      },
      function (e) {
        if (
          e.data.target.history_expanded &&
          !e.data.target.mouse_stay &&
          window?.getSelection()?.toString() == ''
        ) {
          e.data.target.hide();
        }
      }
    );

    this.dom.on(
      'click',
      null,
      {
        target: this
      },
      function (e) {
        if (window?.getSelection()?.toString() == '') e.data.target.expand();
      }
    );

    this.dom.on(
      'mouseenter',
      null,
      {
        target: this
      },
      function (e) {
        const target = e.data.target;
        target.mouse_stay = true;
        target.setColor();
        window.clearTimeout(target.stay_timeout);
      }
    );

    this.dom.on(
      'mouseleave',
      null,
      {
        target: this
      },
      function (e) {
        const target = e.data.target;
        target.mouse_stay = false;
        if (target.history_expanded) return;
        target.stay_timeout = window.setTimeout(
          (target: any) => {
            target.hide();
          },
          200,
          target
        );
      }
    );
  }
}
