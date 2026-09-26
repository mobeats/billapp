const KEY="billapp-invoices-v1";
let invoices=JSON.parse(localStorage.getItem(KEY)||"[]");
let editingId=null;
const $=id=>document.getElementById(id);
const euro=n=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(n)||0);
function iso(d=new Date()){return new Date(d).toISOString().slice(0,10)}
function nextNumber(){return "RE-"+new Date().getFullYear()+"-"+String(invoices.length+1).padStart(4,"0")}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function addItem(data={}){
 const row=document.createElement("div"); row.className="item";
 row.innerHTML='<div class="field"><label>Beschreibung</label><input class="desc" value="'+esc(data.desc||"")+'" placeholder="z. B. Webdesign"></div>'+
 '<div class="field"><label>Menge</label><input class="qty" type="number" min="0" step=".01" value="'+(data.qty??1)+'"></div>'+
 '<div class="field"><label>Einzelpreis (€)</label><input class="price" type="number" min="0" step=".01" value="'+(data.price??0)+'"></div>'+
 '<div class="item-total">0,00 €</div><button type="button" class="icon-btn" aria-label="Position löschen">×</button>';
 row.querySelectorAll("input").forEach(i=>i.addEventListener("input",calculate));
 row.querySelector(".icon-btn").onclick=()=>{row.remove();calculate()};
 $("items").appendChild(row); calculate();
}
function calculate(){
 let net=0;
 document.querySelectorAll(".item").forEach(r=>{
   const v=(+r.querySelector(".qty").value||0)*(+r.querySelector(".price").value||0);
   net+=v; r.querySelector(".item-total").textContent=euro(v);
 });
 const vat=net*(+$("vat").value||0)/100;
 $("net").textContent=euro(net); $("vatAmount").textContent=euro(vat); $("gross").textContent=euro(net+vat);
 return {net,vat,gross:net+vat};
}
function collect(){
 const t=calculate();
 return {id:editingId||crypto.randomUUID(),number:$("number").value,date:$("date").value,dueDate:$("dueDate").value,
 seller:$("seller").value,sellerAddress:$("sellerAddress").value,customer:$("customer").value,customerAddress:$("customerAddress").value,
 notes:$("notes").value,vat:+$("vat").value,items:[...document.querySelectorAll(".item")].map(r=>({desc:r.querySelector(".desc").value,qty:+r.querySelector(".qty").value||0,price:+r.querySelector(".price").value||0})),...t};
}
function persist(){localStorage.setItem(KEY,JSON.stringify(invoices))}
function save(e){
 e.preventDefault(); const inv=collect(); const idx=invoices.findIndex(x=>x.id===inv.id);
 if(idx>=0) invoices[idx]=inv; else invoices.unshift(inv);
 persist(); reset(); render(); $("invoices").scrollIntoView({behavior:"smooth"});
}
function reset(){
 editingId=null; $("formTitle").textContent="Neue Rechnung"; $("invoiceForm").reset();
 $("number").value=nextNumber(); $("date").value=iso(); $("dueDate").value=iso(Date.now()+14*864e5);
 $("items").innerHTML=""; addItem();
}
function load(id){
 const x=invoices.find(i=>i.id===id); if(!x)return; editingId=x.id; $("formTitle").textContent="Rechnung bearbeiten";
 ["number","date","dueDate","seller","sellerAddress","customer","customerAddress","notes","vat"].forEach(k=>$(k).value=x[k]??"");
 $("items").innerHTML=""; x.items.forEach(addItem); $("invoice").scrollIntoView({behavior:"smooth"}); calculate();
}
function removeInvoice(id){
 if(confirm("Rechnung wirklich löschen?")){invoices=invoices.filter(x=>x.id!==id);persist();render()}
}
function preview(id=null){if(id)load(id);setTimeout(()=>window.print(),80)}
function render(){
 const total=invoices.reduce((a,x)=>a+(x.gross||0),0);
 $("statInvoices").textContent=invoices.length; $("statRevenue").textContent=euro(total); $("statOpen").textContent=euro(total);
 const list=$("invoiceList");
 if(!invoices.length){list.innerHTML='<div class="empty">Noch keine Rechnungen gespeichert. Erstelle oben deine erste Rechnung.</div>';return}
 list.innerHTML=invoices.map(x=>'<div class="invoice-row"><strong>'+esc(x.number)+'</strong><div><strong>'+esc(x.customer)+'</strong><br><span>'+new Date(x.date).toLocaleDateString("de-DE")+'</span></div><span>'+esc(x.seller)+'</span><span class="amount">'+euro(x.gross)+'</span><div><button class="button ghost small" onclick="load(\''+x.id+'\')">Bearbeiten</button><button class="button ghost small" onclick="preview(\''+x.id+'\')">PDF</button><button class="button ghost small" onclick="removeInvoice(\''+x.id+'\')">Löschen</button></div></div>').join("");
}
$("invoiceForm").addEventListener("submit",save);
$("addItem").onclick=()=>addItem();
$("resetButton").onclick=reset;
$("startButton").onclick=()=>$("invoice").scrollIntoView({behavior:"smooth"});
$("newInvoiceTop").onclick=()=>{reset();$("invoice").scrollIntoView({behavior:"smooth"})};
$("previewButton").onclick=()=>preview();
$("vat").onchange=calculate;
$("year").textContent=new Date().getFullYear();
reset(); render();

const CUSTOMER_KEY="billapp-customers-v1";
let customers=JSON.parse(localStorage.getItem(CUSTOMER_KEY)||"[]");
function persistCustomers(){localStorage.setItem(CUSTOMER_KEY,JSON.stringify(customers))}
function renderCustomers(){
 const select=$("customerSelect");
 select.innerHTML='<option value="">Kunde auswählen …</option>'+customers.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join("");
 $("customerList").innerHTML=customers.length?customers.map(c=>'<div class="invoice-row"><div><strong>'+esc(c.name)+'</strong><br><span>'+esc(c.address||"Keine Adresse")+'</span></div><button class="button ghost small" onclick="deleteCustomer(\''+c.id+'\')">Löschen</button></div>').join(""):'<div class="empty">Noch keine Kunden gespeichert.</div>';
}
function saveCustomer(){const name=$("newCustomerName").value.trim();if(!name)return alert("Bitte einen Namen eingeben.");customers.unshift({id:crypto.randomUUID(),name,address:$("newCustomerAddress").value.trim()});persistCustomers();$("newCustomerName").value="";$("newCustomerAddress").value="";renderCustomers();}
function deleteCustomer(id){if(confirm("Kunden wirklich löschen?")){customers=customers.filter(c=>c.id!==id);persistCustomers();renderCustomers()}}
$("customerSelect").addEventListener("change",()=>{const c=customers.find(x=>x.id===$("customerSelect").value);if(c){$("customer").value=c.name;$("customerAddress").value=c.address||""}});
$("saveCustomer").onclick=saveCustomer;
renderCustomers();
