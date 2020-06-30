// ==UserScript==
// @name         Tracfone store
// @description  Hide phones for sale that require the purchase of a service plan.
// @version      0.1.0
// @match        *://shop.tracfone.com/*
// @icon         https://shop.tracfone.com/wcsstore/TracfoneStore/images/icons/favicon.ico
// @run-at       document-idle
// @homepage     https://github.com/warren-bank/crx-Tracfone-store/tree/greasemonkey-userscript
// @supportURL   https://github.com/warren-bank/crx-Tracfone-store/issues
// @downloadURL  https://github.com/warren-bank/crx-Tracfone-store/raw/greasemonkey-userscript/greasemonkey-userscript/Tracfone-store.user.js
// @updateURL    https://github.com/warren-bank/crx-Tracfone-store/raw/greasemonkey-userscript/greasemonkey-userscript/Tracfone-store.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// https://www.chromium.org/developers/design-documents/user-scripts

var user_options = {
  "script_injection_delay_ms": 0
}

var payload = function(){
  // short-circuit: URL matches pattern
  const url_regex = new RegExp('^https?://shop\.tracfone\.com/shop/[^/]+/tracfonestore/(?:search/)?phones.*$', 'i')
  if (!url_regex.test(window.location.href))
    return

  let $items
  const getAllItems = () => {
    $items = [...document.querySelectorAll('div.plplist')]
  }

  // short-circuit: has items to filter
  getAllItems()
  if (!$items || !$items.length)
    return

  const getSortOrder = () => {
    const default_value = ''

    const $select = document.getElementById('orderBy')
    if (!$select)
      return default_value

    const $option = [...$select.querySelectorAll(':scope > option[value]')].filter($o => ($o.innerText.toLowerCase() === 'low to high'))
    if (!$option.length === 1)
      return default_value

    return $option[0].value
  }

  const retrieveAllItems = () => {
    if ('URLSearchParams' in window) {
      const searchParams = new URLSearchParams(window.location.search)
      const oldPageSize  = searchParams.get('pageSize')
      const newPageSize  = '200'

      if (oldPageSize === newPageSize)
        return false

      searchParams.set('pageSize', newPageSize)
      searchParams.set('orderBy',  getSortOrder())
      const newURL = window.location.pathname + '?' + searchParams.toString()
      window.location = newURL
      return true
    }
    return false
  }

  const processAllItems = () => {
    getAllItems()
    console.log('count of all items:', $items.length)

    if (!$items || !$items.length)
      return

    const $hidden_items = $items.filter($i => ($i.innerHTML.toLowerCase().indexOf('plan purchase required') >= 0))
    console.log('count of hidden items:', $hidden_items.length)

    if (!$hidden_items || !$hidden_items.length)
      return

    $hidden_items.forEach($i => {$i.style.display = 'none'})

    // update the visible count
    const $heading = document.getElementById('resultsPerSelection1')
    if ($heading)
      $heading.innerText = ($items.length - $hidden_items.length) + ' Results'
  }

  if (!retrieveAllItems())
    processAllItems()
}

var get_hash_code = function(str){
  var hash, i, char
  hash = 0
  if (str.length == 0) {
    return hash
  }
  for (i = 0; i < str.length; i++) {
    char = str.charCodeAt(i)
    hash = ((hash<<5)-hash)+char
    hash = hash & hash  // Convert to 32bit integer
  }
  return Math.abs(hash)
}

var inject_function = function(_function){
  var inline, script, head

  inline = _function.toString()
  inline = '(' + inline + ')()' + '; //# sourceURL=crx_extension.' + get_hash_code(inline)
  inline = document.createTextNode(inline)

  script = document.createElement('script')
  script.appendChild(inline)

  head = document.head
  head.appendChild(script)
}

var bootstrap = function(){
  inject_function(payload)
}

setTimeout(
  bootstrap,
  user_options['script_injection_delay_ms']
)
